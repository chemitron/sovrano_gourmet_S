import { Stack } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native";
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from "../../../components/GradientBackground";
import { MenuCategory } from "../../../src/types";

export default function MenuCategoriasIndex() {
  const db = getFirestore();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");

  // ⭐ Load categories
  useEffect(() => {
    const q = query(
      collection(db, "menuCategories"),
      orderBy("categoryIndex", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: MenuCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuCategory, "id">),
      }));

      setCategories(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ⭐ Add new category using counters/menuCategories/current
  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    const counterRef = doc(db, "counters", "menuCategories");
    const counterSnap = await getDoc(counterRef);

    if (!counterSnap.exists()) {
      Alert.alert("Error", "No existe counters/menuCategories en Firestore");
      return;
    }

    const nextIndex = counterSnap.data().current;
    const newId = nextIndex.toString();

    // Create category
    await setDoc(doc(db, "menuCategories", newId), {
      Categoryname: newCategoryName.trim(),
      categoryIndex: nextIndex,
      isActive: true,
    });

    // Increment counter
    await updateDoc(counterRef, {
      current: nextIndex + 1,
    });

    setNewCategoryName("");
  };

  // ⭐ Edit category name
  const updateCategoryName = async (id: string, name: string) => {
    await updateDoc(doc(db, "menuCategories", id), {
      Categoryname: name.trim(),
    });
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
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle: "Categorías del Menú",
        }}
      />

      <GradientBackground>
        <View style={{ flex: 1, padding: 20 }}>

          {/* ADD CATEGORY */}
          <View
            style={{
              flexDirection: "row",
              marginBottom: 20,
              alignItems: "center",
              gap: 10,
            }}
          >
            <TextInput
              placeholder="Nueva categoría"
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "black",
                padding: 10,
                borderRadius: 8,
                backgroundColor: "white",
              }}
            />
            <Button_style2 title="Agregar" onPress={addCategory} />
          </View>

          {/* CATEGORY LIST */}
          <FlatList
            data={categories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 16,
                  backgroundColor: "#DDCBAB",
                  borderRadius: 10,
                  marginBottom: 12,
                }}
              >
                {/* TOP ROW */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600" }}>
                    ID: {item.categoryIndex}
                  </Text>

                  <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                    {item.Categoryname}
                  </Text>
                </View>

                {/* EDIT NAME */}
                <TextInput
                  defaultValue={item.Categoryname}
                  onEndEditing={(e) =>
                    updateCategoryName(item.id, e.nativeEvent.text)
                  }
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: "white",
                  }}
                />
              </View>
            )}
          />
        </View>
      </GradientBackground>
    </>
  );
}
