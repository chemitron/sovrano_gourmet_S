import type { MenuItem, WeeklyMenu } from "@/src/types";
import { Stack, router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WeeklyMenuScreen() {
  const db = getFirestore();
  const insets = useSafeAreaInsets();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu>({
    monday: { desayuno: [], almuerzo: [], cena: [] },
    tuesday: { desayuno: [], almuerzo: [], cena: [] },
    wednesday: { desayuno: [], almuerzo: [], cena: [] },
    thursday: { desayuno: [], almuerzo: [], cena: [] },
    friday: { desayuno: [], almuerzo: [], cena: [] },
    saturday: { desayuno: [], almuerzo: [], cena: [] },
    sunday: { desayuno: [], almuerzo: [], cena: [] },
  });

  // ⭐ NEW: Prices for desayuno & almuerzo
  const [valorDesayuno, setValorDesayuno] = useState<string>("15000");
  const [valorAlmuerzo, setValorAlmuerzo] = useState<string>("50000");
  const [searchText, setSearchText] = useState("");

  // ⭐ Load settings from Firestore
  useEffect(() => {
    const loadSettings = async () => {
      const ref = doc(db, "settings", "menu_semanal");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setValorDesayuno(String(data.valorDesayuno ?? "15000"));
        setValorAlmuerzo(String(data.valorAlmuerzo ?? "50000"));
      }
    };
    loadSettings();
  }, []);

  // ⭐ Día filter (Lunes → Domingo)
  const dayOptions = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ] as const;

  // ⭐ Meal filter (only Desayuno + Almuerzo)
  const mealOptions = [
    { key: "desayuno", label: "Desayuno" },
    { key: "almuerzo", label: "Almuerzo" },
  ] as const;

  const [selectedDay, setSelectedDay] =
    useState<(typeof dayOptions)[number]["key"]>("monday");
  const [selectedMeal, setSelectedMeal] =
    useState<(typeof mealOptions)[number]["key"]>("desayuno");

  // Load menu items (ONLY soloEmpleado)
  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("itemIndex", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: MenuItem[] = snap.docs.map((d) => {
        const data = d.data() as MenuItem;
        return { ...data, id: d.id };
      });

      const filtered = list.filter((item) => item.menu_semanal === true);
      setMenuItems(filtered);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Load existing weekly menu
  useEffect(() => {
    const loadWeekly = async () => {
      const ref = doc(db, "weeklyMenu", "current");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setWeeklyMenu(snap.data() as WeeklyMenu);
      }
    };
    loadWeekly();
  }, []);

  const toggleItem = (
    day: keyof WeeklyMenu,
    meal: "desayuno" | "almuerzo",
    itemId: string
  ) => {
    setWeeklyMenu((prev) => {
      const exists = prev[day][meal].includes(itemId);

      return {
        ...prev,
        [day]: {
          ...prev[day],
          [meal]: exists
            ? prev[day][meal].filter((id) => id !== itemId)
            : [...prev[day][meal], itemId],
        },
      };
    });
  };

  const saveWeeklyMenu = async () => {
    // ⭐ Save weekly menu
    await setDoc(doc(db, "weeklyMenu", "current"), {
      ...weeklyMenu,
      updatedAt: new Date().toISOString(),
    });

    // ⭐ Save settings
    await setDoc(doc(db, "settings", "menu_semanal"), {
      valorDesayuno: Number(valorDesayuno),
      valorAlmuerzo: Number(valorAlmuerzo),
      updatedAt: new Date().toISOString(),
    });

    alert("Menú semanal y valores guardados");
    router.back();
  };

  if (loading) {
    return (
      <View
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const currentDayLabel =
    dayOptions.find((d) => d.key === selectedDay)?.label ?? "";
  const currentMealLabel =
    mealOptions.find((m) => m.key === selectedMeal)?.label ?? "";

  const selectedIds =
    weeklyMenu[selectedDay][selectedMeal as "desayuno" | "almuerzo"];

  return (
    <>
      <Stack.Screen options={{ title: "Menú Semanal" }} />

      <View style={{ flex: 1 }}>
        <ScrollView style={{ padding: 20 }}>

<View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  }}
>
  {/* Desayuno */}
  <View style={{ width: "48%", marginBottom: 12 }}>
    <Text style={{ fontSize: 16, marginBottom: 4 }}>Valor desayuno</Text>
    <TextInput
      value={valorDesayuno}
      onChangeText={setValorDesayuno}
      keyboardType="numeric"
      style={{
        backgroundColor: "#eee",
        padding: 10,
        borderRadius: 8,
      }}
    />
  </View>

  {/* Almuerzo */}
  <View style={{ width: "48%", marginBottom: 12 }}>
    <Text style={{ fontSize: 16, marginBottom: 4 }}>Valor almuerzo</Text>
    <TextInput
      value={valorAlmuerzo}
      onChangeText={setValorAlmuerzo}
      keyboardType="numeric"
      style={{
        backgroundColor: "#eee",
        padding: 10,
        borderRadius: 8,
      }}
    />
  </View>
</View>

          {/* ⭐ Filtro Día */}
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
                <TouchableOpacity
                  key={day.key}
                  onPress={() => setSelectedDay(day.key)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    backgroundColor: active ? "#a68f5b" : "#eee",
                  }}
                >
                  <Text
                    style={{
                      color: active ? "white" : "#333",
                      fontWeight: "600",
                    }}
                  >
                    {day.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ⭐ Filtro Comida */}

<View
  style={{
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  }}
>
  {mealOptions.map((meal) => {
    const active = selectedMeal === meal.key;
    return (
      <TouchableOpacity
        key={meal.key}
        onPress={() => setSelectedMeal(meal.key)}
        style={{
          flex: 1,
          marginRight: meal.key === "desayuno" ? 8 : 0, // spacing between buttons
          marginLeft: meal.key === "almuerzo" ? 8 : 0,
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 8,
          backgroundColor: active ? "#a68f5b" : "#eee",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            color: active ? "white" : "#333",
            fontWeight: "600",
          }}
        >
          {meal.label}
        </Text>
      </TouchableOpacity>
    );
  })}
</View>

          {/* ⭐ Search filter */}
<TextInput
  placeholder="Buscar item..."
  placeholderTextColor="#666"
  value={searchText}
  onChangeText={setSearchText}
  style={{
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    color: "#111", 
  }}
/>

          {/* ⭐ Lista de items */}
          {menuItems
  .filter((item) =>
    item.ItemName.toLowerCase().includes(searchText.toLowerCase())
  )
  .map((item) => {
            const selected = selectedIds.includes(item.id);

            return (
              <TouchableOpacity
                key={item.id}
                onPress={() =>
                  toggleItem(
                    selectedDay,
                    selectedMeal as "desayuno" | "almuerzo",
                    item.id
                  )
                }
                style={{
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 8,
                  backgroundColor: selected ? "#4CAF50" : "#eee",
                }}
              >
                <Text
                  style={{
                    fontSize: 18,
                    color: selected ? "white" : "black",
                  }}
                >
                  {item.ItemName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ⭐ Save button with SafeArea */}
        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderColor: "#ddd",
            backgroundColor: "white",
            marginBottom: insets.bottom + 10,
          }}
        >
          <TouchableOpacity
            onPress={saveWeeklyMenu}
            style={{
              backgroundColor: "black",
              padding: 16,
              borderRadius: 10,
            }}
          >
            <Text
              style={{
                color: "white",
                textAlign: "center",
                fontSize: 18,
              }}
            >
              Guardar Menú Semanal
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}
