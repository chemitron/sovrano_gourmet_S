import { Stack, router } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getNextSequence } from "../../services/firestore/counters";
import { auth } from '../../services/firestore/firebase';
import type { MenuCategory, MenuItem } from "../../src/types";
import { useInvitado, useNombreEstilista, useNombreInvitado } from "../context/InvitadoContext";

export default function MenuScreen({
  role,
  email,
  username,
}: {
  role?: string;
  email?: string | null;
  username?: string | null;
}) {

  const db = getFirestore();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [itemsInOrder, setItemsInOrder] = useState<any[]>([]);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const { invitadoEmail } = useInvitado();
  const { nombreInvitado } = useNombreInvitado();
  const { nombreEstilista } = useNombreEstilista();
  const empleadoEmail = auth.currentUser?.email ?? null;

const invitadoValue =
  role === "empleado"
    ? empleadoEmail
    : invitadoEmail;

const nombreInvitadoValue = nombreInvitado;
const nombreEstilistaValue = nombreEstilista;

useEffect(() => {

  if (!auth.currentUser) return;

  const q = query(
    collection(db, "orders"),
    where("userUid", "==", auth.currentUser.uid),
    where("status", "==", "pendiente")
  );

  const unsub = onSnapshot(
    q,
    (snapshot) => {

      if (snapshot.empty) {
        setOrderId(null);
        setItemsInOrder([]);
        setCartCount(0);
        return;
      }

      const docSnap = snapshot.docs[0];
      const data = docSnap.data();

      setOrderId(docSnap.id);
      setOrderNumber(data.orderNumber);
      setItemsInOrder(data.items || []);
      setCartCount(data.items?.length ?? 0);
    },
    (err) => {
    }
  );

  return () => {
    unsub();
  };
}, []);

const visibleItems = items.filter((item) => {
  if (item.soloEmpleado) {
    return role === "empleado" || role === "admin";
  }
  return true;
});

  // Load categories
  useEffect(() => {

  const q = query(
    collection(db, "menuCategories"),
    where("isActive", "==", true),
    orderBy("categoryIndex", "asc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {

      const list: MenuCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuCategory, "id">),
      }));

      setCategories(list);
    },
    (err) => {
    }
  );

  return () => {
    unsubscribe();
  };
}, []);

  // Load ONLY available items
  useEffect(() => {

  const q = query(
    collection(db, "menuItems"),
    where("isAvailable", "==", true),
    orderBy("itemIndex", "asc")
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {

      const list: MenuItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuItem, "id">),
      }));

      setItems(list);
      setLoading(false);
    },
    (err) => {
    }
  );

  return () => {
    unsubscribe();
  };
}, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  function getPriceForRole(item: MenuItem, role: string | undefined) {
  return role === "empleado"
    ? item.priceEmployee
    : item.priceCustomer;
}

async function addItemToOrder(item: MenuItem) {
  const auth = getAuth();

  try {
    // ⭐ Determine the correct price based on user role
    const price =
      role === "empleado"
        ? item.priceEmployee
        : item.priceCustomer;

    // ⭐ CASE 1 — No order exists yet → create one
    if (!orderId) {
      const orderNumber = await getNextSequence("orders");

      const orderRef = doc(db, "orders", String(orderNumber));

  await setDoc(orderRef, {
  orderNumber,
  userUid: auth.currentUser?.uid ?? null,

  // ⭐ Store role ALWAYS
  role: role ?? "usuario",

  // ⭐ If guest → use invitadoEmail
  userEmail: role === "invitado" ? invitadoEmail : email ?? null,

  username: role === "invitado" ? invitadoEmail?.replace("@sovranogourmet.com", "") ?? null : (email?.split("@")[0] ?? null),

  // ⭐ Always store invitado
  invitado: invitadoValue ?? null,
  nombreInvitado: nombreInvitadoValue ?? null,
  nombreEstilista: nombreEstilistaValue ?? null,

  createdAt: serverTimestamp(),
  status: "pendiente",
  paymentStatus: "pendiente",

  items: [
    {
      itemId: item.id,
      ItemName: item.ItemName,
      price,
      qty: 1,
      imageUrl: item.imageUrl,
      prepTime: item.prepTime,
    },
  ],
});

      setOrderId(String(orderNumber));
      return;
    }

    // ⭐ CASE 2 — Order exists → append item
    const orderRef = doc(db, "orders", String(orderId));

    await updateDoc(orderRef, {
  username: username ?? null,

  // ⭐ Keep role updated
  role: role ?? "usuario",

  // ⭐ Always keep invitado updated
  invitado: invitadoValue ?? null,
  nombreInvitado: nombreInvitadoValue ?? null,
  nombreEstilista: nombreEstilistaValue ?? null,

  items: [
    ...itemsInOrder,
    {
      itemId: item.id,
      ItemName: item.ItemName,
      price,
      qty: 1,
      imageUrl: item.imageUrl,
      prepTime: item.prepTime,
    },
  ],
});
  } catch (err) {
  }
}

  return (
    <>
      <Stack.Screen
  options={{
    headerTitleAlign: "center",
    headerTitle: "Menu",
    headerRight: () => (
      <TouchableOpacity
        onPress={() => {
          if (orderId) {
            router.push({
              pathname: "/order/[orderId]",
              params: { orderId },
        });

          }
        }}
        style={{ marginRight: 16 }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 20 }}>🛒</Text>
          {cartCount > 0 && (
            <View
              style={{
                backgroundColor: "red",
                borderRadius: 10,
                paddingHorizontal: 6,
                marginLeft: 4,
              }}
            >
              <Text style={{ color: "white", fontWeight: "bold", fontSize: 12 }}>
                {cartCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    ),
  }}
/>

      <View style={{ flex: 1, padding: 20 }}>
        {/* Optional: show email for debugging */}
        {role === "usuario" && email && (
          <Text style={{ marginBottom: 10, color: "#555" }}>
            Logged in as: {email}
          </Text>
        )}

        {/* CATEGORY FILTER */}
        <Text style={styles.filterLabel}>Categoría</Text>

        <View
          style={{
            borderWidth: 1,
            borderColor: "transparent",
            borderRadius: 8,
            backgroundColor: "#E9E4D4",
            marginBottom: 20,
          }}
        >
          <View style={styles.toggleContainer}>
            {/* ALL */}
            <TouchableOpacity
              onPress={() => setCategoryFilter("all")}
              style={[
                styles.toggleButton,
                categoryFilter === "all" && styles.toggleButtonActive,
                { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
              ]}
            >
              <Text
                style={[
                  styles.toggleButtonText,
                  categoryFilter === "all" && styles.toggleButtonTextActive,
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            {/* DYNAMIC CATEGORY BUTTONS */}
            {categories.map((cat, index) => {
              const isLast = index === categories.length - 1;

              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setCategoryFilter(cat.id)}
                  style={[
                    styles.toggleButton,
                    categoryFilter === cat.id && styles.toggleButtonActive,
                    isLast && {
                      borderTopRightRadius: 10,
                      borderBottomRightRadius: 10,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.toggleButtonText,
                      categoryFilter === cat.id &&
                        styles.toggleButtonTextActive,
                    ]}
                  >
                    {cat.Categoryname}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* CATEGORY GROUPS */}
        <FlatList
  data={categories}
  keyExtractor={(cat) => cat.id}
  renderItem={({ item: category }) => {
    const itemsInCategory = visibleItems
      .filter((i) =>
        categoryFilter === "all"
          ? true
          : String(i.categoryId) === categoryFilter
      )
      .filter((i) => i.categoryId === Number(category.id));

    if (itemsInCategory.length === 0) return null;

    return (
      <View style={{ marginBottom: 30 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text style={styles.categoryHeader}>
            {category.Categoryname}
          </Text>

          <Text style={styles.tapToAddText}>
            Tocar plato para adicionar a la orden
          </Text>
        </View>

        {itemsInCategory.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <TouchableOpacity onPress={() => addItemToOrder(item)}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.itemImage}
                  />
                ) : (
                  <View style={styles.noImageBox}>
                    <Text style={{ color: "#666", fontSize: 12 }}>
                      Sin imagen
                    </Text>
                  </View>
                )}

                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.ItemName}</Text>
                  <Text style={styles.itemDetails}>
                    ${getPriceForRole(item, role).toFixed(2)} •{" "}
                    {item.prepTime} min
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  }}
/>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 20 },
  filterLabel: { fontSize: 16, fontWeight: "bold", marginBottom: 6 },

  toggleContainer: {
    flexDirection: "row",
    borderRadius: 10,
    overflow: "hidden",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  toggleButtonActive: {
    backgroundColor: "#a68f5b",
  },
  toggleButtonText: {
    color: "#444",
    fontWeight: "600",
    fontSize: 12,
  },
  toggleButtonTextActive: {
    color: "white",
    fontWeight: "700",
  },

  categoryHeader: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#3e3e3e",
  },
  itemCard: {
    backgroundColor: "#DDCBAB",
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#eee",
  },
  noImageBox: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: { fontSize: 18, fontWeight: "bold" },

  itemDetails: { marginTop: 4, fontSize: 14, color: "#444" },

  tapToAddText: {
  fontSize: 12,
  color: "black",
  marginLeft: 8,
  fontStyle: "italic",
},
});
