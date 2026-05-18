import type { MenuItem, WeeklyMenu } from "@/src/types";
import { Stack, router } from "expo-router";
import { collection, doc, getDoc, getFirestore, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
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

  const days = [
    { key: "monday", label: "Lunes" },
    { key: "tuesday", label: "Martes" },
    { key: "wednesday", label: "Miércoles" },
    { key: "thursday", label: "Jueves" },
    { key: "friday", label: "Viernes" },
    { key: "saturday", label: "Sábado" },
    { key: "sunday", label: "Domingo" },
  ];

  const meals = [
    { key: "desayuno", label: "Desayuno" },
    { key: "almuerzo", label: "Almuerzo" },
    { key: "cena", label: "Cena" },
  ];

  // Load menu items (ONLY soloEmpleado)
  useEffect(() => {
    const q = query(collection(db, "menuItems"), orderBy("itemIndex", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const list: MenuItem[] = snap.docs.map((d) => {
        const data = d.data() as MenuItem;
        return { ...data, id: d.id };
      });

      // ⭐ FILTER: Only show items marked as soloEmpleado
      const filtered = list.filter((item) => item.soloEmpleado === true);

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
    meal: "desayuno" | "almuerzo" | "cena",
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
    await setDoc(doc(db, "weeklyMenu", "current"), {
      ...weeklyMenu,
      updatedAt: new Date().toISOString(),
    });

    alert("Menú semanal guardado");
    router.back();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Menú Semanal" }} />

      <ScrollView style={{ padding: 20 }}>
        {days.map((day) => (
          <View key={day.key} style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 10 }}>
              {day.label}
            </Text>

            {meals.map((meal) => (
              <View key={meal.key} style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 6 }}>
                  {meal.label}
                </Text>

                {menuItems.map((item) => {
                  const selected = weeklyMenu[day.key as keyof WeeklyMenu][
                    meal.key as "desayuno" | "almuerzo" | "cena"
                  ].includes(item.id);

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() =>
                        toggleItem(
                          day.key as keyof WeeklyMenu,
                          meal.key as "desayuno" | "almuerzo" | "cena",
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
              </View>
            ))}
          </View>
        ))}

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
      </ScrollView>


    </>
  );
}
