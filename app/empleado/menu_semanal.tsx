import type { MenuItem, WeeklyMenu } from "@/src/types";
import { Stack } from "expo-router";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getNextSequence } from "../../services/firestore/counters";

export default function WeeklyMenuEmpleado() {
  const db = getFirestore();
  const [valorDesayuno, setValorDesayuno] = useState<number>(15000);
  const [valorAlmuerzo, setValorAlmuerzo] = useState<number>(50000);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [loading, setLoading] = useState(true);

  const dayOptions = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ] as const;

  const mealOptions = [
    { key: "desayuno", label: "Desayuno" },
    { key: "almuerzo", label: "Almuerzo" },
  ] as const;

  const [selectedDay, setSelectedDay] =
    useState<(typeof dayOptions)[number]["key"]>("monday");
  const [selectedMeal, setSelectedMeal] =
    useState<(typeof mealOptions)[number]["key"]>("desayuno");

  // Load menu items
  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("itemIndex", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: MenuItem[] = snap.docs.map((d) => {
        const data = d.data() as MenuItem;
        return { ...data, id: d.id };
      });
      setMenuItems(list);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
  const loadSettings = async () => {
    const ref = doc(db, "settings", "menu_semanal");
    const snap = await getDoc(ref);

    if (snap.exists()) {
      const data = snap.data();
      setValorDesayuno(data.valorDesayuno ?? 15000);
      setValorAlmuerzo(data.valorAlmuerzo ?? 50000);
    }
  };

  loadSettings();
}, []);

  // Load weekly menu (auto-create if missing)
  useEffect(() => {
    const loadWeekly = async () => {
      const ref = doc(db, "weeklyMenu", "current");
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        const empty: WeeklyMenu = {
          monday: { desayuno: [], almuerzo: [], cena: [] },
          tuesday: { desayuno: [], almuerzo: [], cena: [] },
          wednesday: { desayuno: [], almuerzo: [], cena: [] },
          thursday: { desayuno: [], almuerzo: [], cena: [] },
          friday: { desayuno: [], almuerzo: [], cena: [] },
          saturday: { desayuno: [], almuerzo: [], cena: [] },
          sunday: { desayuno: [], almuerzo: [], cena: [] },
        };

        await setDoc(ref, empty);
        setWeeklyMenu(empty);
      } else {
        setWeeklyMenu(snap.data() as WeeklyMenu);
      }

      setLoading(false);
    };

    loadWeekly();
  }, []);

  if (loading || !weeklyMenu) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currentDayLabel =
    dayOptions.find((d) => d.key === selectedDay)?.label ?? "";
  const currentMealLabel =
    mealOptions.find((m) => m.key === selectedMeal)?.label ?? "";

  const dayData =
    weeklyMenu[selectedDay] || { desayuno: [], almuerzo: [], cena: [] };

  const ids = dayData[selectedMeal as "desayuno" | "almuerzo"] || [];

  const itemsForMeal = menuItems.filter((item) => ids.includes(item.id));

  // ⭐ ORDERING FUNCTION WITH ACCOUNT CHARGE
  async function ordenarMenuDelDia() {
    try {
      const authInstance = getAuth();
      const currentUser = authInstance.currentUser;

      if (!currentUser) {
        alert("Debes iniciar sesión para ordenar.");
        return;
      }

      const userEmail = currentUser.email;
      if (!userEmail) {
        alert("No se pudo determinar el correo del usuario.");
        return;
      }

      const usernameFinal =
        currentUser.displayName || userEmail.split("@")[0] || "Empleado";

      const itemName =
        selectedMeal === "desayuno"
          ? "Desayuno del día"
          : "Almuerzo del día";

      const price =
  selectedMeal === "desayuno"
    ? valorDesayuno
    : valorAlmuerzo;

      // 1. Create order number
      const orderNumber = await getNextSequence("orders");
      const orderRef = doc(db, "orders", String(orderNumber));

      // 2. Create order
      await setDoc(orderRef, {
  orderNumber,
  userUid: currentUser.uid,

  role: "empleado",
  userEmail,
  username: usernameFinal,

  invitado: null,
  nombreInvitado: null,
  nombreEstilista: null,

  createdAt: serverTimestamp(),
  status: "cargado a cuenta",
  served: false,

  // ⭐ REQUIRED FOR cuenta-personal
  chargedToAccount: true,
  accountPaid: false,

  paymentMethod: "cuenta-personal-empleado",
  paymentStatus: "charged",
  approvalStatus: "aprobado",
  paidAt: serverTimestamp(),

  total: price,

  items: [
    {
      itemId: "menu_del_dia",
      ItemName: itemName,
      price,
      qty: 1,
      imageUrl: null,
      prepTime: 0,
    },
  ],
});

      // 3. Charge the account
      const cuentaRef = doc(db, "cuentas_personales", userEmail);
      await updateDoc(cuentaRef, {
        balance: increment(price),
      });

      Alert.alert("Orden creada", `${itemName} fue ordenado y cargado a la cuenta.`);
    } catch (err) {
      console.log("🔥 ordenarMenuDelDia error:", err);
      alert("No se pudo crear la orden");
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: "Menú Semanal" }} />

      <ScrollView style={{ padding: 20 }}>
        {/* ⭐ Read-only price display (side by side) */}
<View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  }}
>
  <Text style={{ fontSize: 16, color: "#444", fontWeight: "600" }}>
    Desayuno:{" "}
    <Text style={{ fontWeight: "700" }}>
      ${valorDesayuno.toLocaleString("en-US")}
    </Text>
  </Text>

  <Text style={{ fontSize: 16, color: "#444", fontWeight: "600" }}>
    Almuerzo:{" "}
    <Text style={{ fontWeight: "700" }}>
      ${valorAlmuerzo.toLocaleString("en-US")}
    </Text>
  </Text>
</View>

        {/* Filtro Día */}
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>
          Día
        </Text>
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 8,
            marginBottom: 16,
          }}
        >
          {dayOptions.map((day) => {
            const active = selectedDay === day.key;
            return (
              <View
                key={day.key}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: active ? "#a68f5b" : "#eee",
                }}
              >
                <Text
                  onPress={() => setSelectedDay(day.key)}
                  style={{
                    color: active ? "white" : "#333",
                    fontWeight: "600",
                  }}
                >
                  {day.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Filtro Comida */}
        <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 6 }}>
          Comida
        </Text>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {mealOptions.map((meal) => {
            const active = selectedMeal === meal.key;
            return (
              <View
                key={meal.key}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: active ? "#a68f5b" : "#eee",
                }}
              >
                <Text
                  onPress={() => setSelectedMeal(meal.key)}
                  style={{
                    color: active ? "white" : "#333",
                    fontWeight: "600",
                  }}
                >
                  {meal.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* ⭐ Title + ORDENAR button */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "bold",
            }}
          >
            {currentDayLabel} — {currentMealLabel}
          </Text>

          <TouchableOpacity
            onPress={ordenarMenuDelDia}
            style={{
              backgroundColor: "#a68f5b",
              paddingVertical: 6,
              paddingHorizontal: 12,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
              Ordenar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Lista de items */}
        {itemsForMeal.length === 0 ? (
          <Text style={{ color: "#666", marginBottom: 10 }}>
            No hay items asignados
          </Text>
        ) : (
          itemsForMeal.map((item) => (
            <View
              key={item.id}
              style={{
                padding: 12,
                backgroundColor: "#eee",
                borderRadius: 8,
                marginBottom: 8,
              }}
            >
              <Text style={{ fontSize: 18 }}>{item.ItemName}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </>
  );
}
