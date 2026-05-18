import type { MenuItem, WeeklyMenu } from "@/src/types";
import { Stack } from "expo-router";
import { collection, doc, getDoc, getFirestore, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";

export default function WeeklyMenuEmpleado() {
  const db = getFirestore();

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu | null>(null);
  const [loading, setLoading] = useState(true);

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

  // Load weekly menu
  useEffect(() => {
  const loadWeekly = async () => {
    const ref = doc(db, "weeklyMenu", "current");
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      // Auto-create empty structure
      const empty: WeeklyMenu = {
        monday: { desayuno: [], almuerzo: [], cena: [] },
        tuesday: { desayuno: [], almuerzo: [], cena: [] },
        wednesday: { desayuno: [], almuerzo: [], cena: [] },
        thursday: { desayuno: [], almuerzo: [], cena: [] },
        friday: { desayuno: [], almuerzo: [], cena: [] },
        saturday: { desayuno: [], almuerzo: [], cena: [] },
        sunday: { desayuno: [], almuerzo: [], cena: [] }
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

  return (
    <>
      <Stack.Screen options={{ title: "Menú Semanal" }} />

      <ScrollView style={{ padding: 20 }}>
        {days.map((day) => (
          <View key={day.key} style={{ marginBottom: 40 }}>
            <Text style={{ fontSize: 26, fontWeight: "bold", marginBottom: 10 }}>
              {day.label}
            </Text>

            {meals.map((meal) => {
              const dayData =
  weeklyMenu[day.key as keyof WeeklyMenu] || {
    desayuno: [],
    almuerzo: [],
    cena: []
  };

const ids =
  dayData[meal.key as "desayuno" | "almuerzo" | "cena"] || [];

              const itemsForMeal = menuItems.filter((item) =>
                ids.includes(item.id)
              );

              return (
                <View key={meal.key} style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 20, fontWeight: "600", marginBottom: 6 }}>
                    {meal.label}
                  </Text>

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
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </>
  );
}
