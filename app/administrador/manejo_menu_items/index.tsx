import { Stack, router } from "expo-router";
import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from "../../../components/GradientBackground";
import type { MenuItem } from "../../../src/types";

type MenuCategory = {
  id: string;
  Categoryname: string;
  categoryIndex: number;
};

export default function Manejo_Menu_ItemsIndex() {
  const db = getFirestore();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");

  // Load categories
  useEffect(() => {
    const q = query(
      collection(db, "menuCategories"),
      orderBy("categoryIndex", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MenuCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuCategory, "id">),
      }));
      setCategories(list);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Load items
  useEffect(() => {
    const q = query(
      collection(db, "menuItems"),
      orderBy("itemIndex", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: MenuItem[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuItem, "id">),
      }));
      setItems(list);
      setLoading(false);
    });

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

  return (
  <>
    <Stack.Screen
      options={{
        headerTitleAlign: "center",
        headerTitle: "Platos del Menú",
      }}
    />

    <GradientBackground>
      <View style={{ flex: 1, padding: 20 }}>

        {/* ADD NEW ITEM BUTTON */}
        <Button_style2
          title="+ Agregar Nuevo Plato"
          onPress={() =>
            router.push("/administrador/manejo_menu_items/add_menu_items")
          }
        />

        {/* AVAILABILITY FILTER */}
        <View style={{ marginBottom: 20 }}>
          <View
            style={{
              borderWidth: 1,
              borderColor: "transparent",
              borderRadius: 8,
              backgroundColor: "'#E9E4D4'",
              marginTop: 10,
            }}
          >
            {/* AVAILABILITY TOGGLE BUTTONS */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                onPress={() => setAvailabilityFilter("all")}
                style={[
                  styles.toggleButton,
                  availabilityFilter === "all" && styles.toggleButtonActive,
                  { borderTopLeftRadius: 10, borderBottomLeftRadius: 10 },
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    availabilityFilter === "all" &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAvailabilityFilter("available")}
                style={[
                  styles.toggleButton,
                  availabilityFilter === "available" &&
                    styles.toggleButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    availabilityFilter === "available" &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  Disponible
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAvailabilityFilter("unavailable")}
                style={[
                  styles.toggleButton,
                  availabilityFilter === "unavailable" &&
                    styles.toggleButtonActive,
                  { borderTopRightRadius: 10, borderBottomRightRadius: 10 },
                ]}
              >
                <Text
                  style={[
                    styles.toggleButtonText,
                    availabilityFilter === "unavailable" &&
                      styles.toggleButtonTextActive,
                  ]}
                >
                  No disponible
                </Text>
              </TouchableOpacity>
            </View>

            {/* CATEGORY FILTER */}
            <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 6 }}>
              Categoría
            </Text>

            <View
              style={{
                borderWidth: 1,
                borderColor: "transparent",
                borderRadius: 8,
                backgroundColor: "'#E9E4D4'",
              }}
            >
              <View style={styles.toggleContainer}>
                {/* ALL CATEGORIES */}
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
                      categoryFilter === "all" &&
                        styles.toggleButtonTextActive,
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
                        categoryFilter === cat.id &&
                          styles.toggleButtonActive,
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
          </View>
        </View>

        {/* SEARCH BAR */}
<View style={{ marginBottom: 0 }}>
  <TextInput
    placeholder="Buscar plato..."
    placeholderTextColor="#666"
    value={searchText}
    onChangeText={setSearchText}
    style={{
      backgroundColor: "#fff",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#ccc",
      fontSize: 16,
    }}
  />
</View>


        {/* LISTA DE PLATOS SIN CATEGORÍAS — SORTED ALPHABETICALLY */}
        <ScrollView style={{ marginTop: 0 }}>
          {items
  // CATEGORY FILTER
  .filter((i) => {
    if (categoryFilter === "all") return true;
    return String(i.categoryId) === categoryFilter;
  })
  // AVAILABILITY FILTER
  .filter((i) => {
    if (availabilityFilter === "available") return i.isAvailable === true;
    if (availabilityFilter === "unavailable") return i.isAvailable === false;
    return true;
  })
  // SEARCH FILTER
  .filter((i) =>
    i.ItemName.toLowerCase().includes(searchText.toLowerCase())
  )
  // SORT ALPHABETICALLY
  .sort((a, b) => a.ItemName.localeCompare(b.ItemName))
  .map((item) => (
              <View key={item.id} style={styles.itemCard}>
                {/* IMAGE + TITLE ROW */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 0,
                  }}
                >
                  {item.imageUrl ? (
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 8,
                        marginRight: 12,
                        backgroundColor: "#eee",
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 8,
                        marginRight: 12,
                        backgroundColor: "#ccc",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <Text style={{ color: "#666", fontSize: 12 }}>
                        Sin imagen
                      </Text>
                    </View>
                  )}

                  {/* NAME + EDIT BUTTONS */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.ItemName}</Text>

                    <View style={{ marginBottom: 5 }}>
                      <Button_style2
                        title="Editar"
                        onPress={() =>
                          router.push({
                            pathname:
                              "/administrador/manejo_menu_items/edit_menu_items",
                            params: { itemId: item.id },
                          })
                        }
                      />
                    </View>

                    <Button_style2
                      title="Ingredientes"
                      onPress={() =>
                        router.push({
                          pathname:
                            "/administrador/manejo_menu_items/itemIngredients",
                          params: { itemId: item.id },
                        })
                      }
                    />
                  </View>
                </View>

                {/* DETAILS GRID */}
                <View style={styles.grid}>
                  <View style={styles.cell}>
                    <Text style={styles.itemDetails}>
                      Valor cliente: ${item.priceCustomer}
                    </Text>
                  </View>

                  <View style={styles.cell}>
                    <Text style={styles.itemDetails}>
                      Tiempo: {item.prepTime} min
                    </Text>
                  </View>

                  <View style={styles.cell}>
                    <Text style={styles.itemDetails}>
                      Valor empleado: ${item.priceEmployee}
                    </Text>
                  </View>

                  <View style={styles.cell}>
                    <Text style={styles.itemDetails}>
                      {item.isAvailable
                        ? "Plato Activo"
                        : "Plato Inactivo"}
                    </Text>
                  </View>
                </View>

                {/* SOLO EMPLEADO */}
                <View style={styles.statusRow}>
                  {item.soloEmpleado && (
                    <Text
                      style={[
                        styles.itemDetails,
                        {
                          fontWeight: "bold",
                          color: "#8B0000",
                          marginLeft: 12,
                        },
                      ]}
                    >
                      Solo empleado
                    </Text>
                  )}
                </View>
              </View>
            ))}
        </ScrollView>
      </View>
    </GradientBackground>
  </>
);
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "black",
    paddingVertical: 14,
    borderRadius: 10,
    marginBottom: 20,
  },
  addButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
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
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  editButton: {
    backgroundColor: "#333",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  editButtonText: {
    color: "white",
    fontSize: 14,
  },
  itemDetails: {
    marginTop: 6,
    fontSize: 14,
    color: "#444",
  },
  toggleContainer: {
  flexDirection: "row",
  marginBottom: 10,
  borderRadius: 10,
  overflow: "hidden",
  borderWidth: 1,
  borderColor: "#a68f5b",
  backgroundColor: "#e8dfcf",   // ← unified background
},

toggleButton: {
  flex: 1,
  paddingVertical: 10,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "transparent",   // ← no background for inactive
},

toggleButtonActive: {
  backgroundColor: "#a68f5b",       // ← only active button gets color
},

toggleButtonText: {
  color: "#444",
  fontWeight: "600",
  fontSize:13,
},

toggleButtonTextActive: {
  color: "white",
  fontWeight: "700",
},

statusRow: {
  flexDirection: "row",
  alignItems: "center",
},
grid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginTop: 8,
},

cell: {
  width: "48%",     // two columns
  marginBottom: 10, // spacing between rows
},

});
