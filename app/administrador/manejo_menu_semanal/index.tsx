import type { MenuItem, WeeklyMenu } from "@/src/types";
import { Stack } from "expo-router";
import { collection, doc, getDoc, getFirestore, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function WeeklyMenuScreen() {
  const db = getFirestore();

const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
const [loading, setLoading] = useState(true);

const [weeklyMenu, setWeeklyMenu] = useState<WeeklyMenu>({
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
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

  // Load menu items
  useEffect(() => {
  const q = query(collection(db, "menuItems"), orderBy("itemIndex", "asc"));
  const unsub = onSnapshot(q, (snap) => {
    const list: MenuItem[] = snap.docs.map((d) => {
      const data = d.data() as MenuItem;
      return {
        ...data,      // all Firestore fields
        id: d.id,     // force id from Firestore doc ID
      };
    });

    setMenuItems(list);
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

  const toggleItem = (day: keyof WeeklyMenu, itemId: string) => {
  setWeeklyMenu(prev => {
    const exists = prev[day].includes(itemId);
    return {
      ...prev,
      [day]: exists
        ? prev[day].filter(id => id !== itemId)
        : [...prev[day], itemId],
    };
  });
};

  const saveWeeklyMenu = async () => {
    await setDoc(doc(db, "weeklyMenu", "current"), {
      ...weeklyMenu,
      updatedAt: new Date().toISOString(),
    });

    alert("Menú semanal guardado");
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
          <View key={day.key} style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 22, fontWeight: "bold", marginBottom: 10 }}>
              {day.label}
            </Text>

            {menuItems.map((item) => {
              const selected = weeklyMenu[day.key as keyof WeeklyMenu];

              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleItem(day.key as keyof WeeklyMenu, item.id)}
                  style={{
                    padding: 12,
                    borderRadius: 8,
                    marginBottom: 8,
                    backgroundColor: selected ? "#4CAF50" : "#eee",
                  }}
                >
                  <Text style={{ fontSize: 18, color: selected ? "white" : "black" }}>
                    {item.ItemName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <TouchableOpacity
          onPress={saveWeeklyMenu}
          style={{
            backgroundColor: "black",
            padding: 16,
            borderRadius: 10,
            marginTop: 20,
          }}
        >
          <Text style={{ color: "white", textAlign: "center", fontSize: 18 }}>
            Guardar Menú Semanal
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}
