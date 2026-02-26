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
  FlatList,
  Text,
  TextInput,
  View
} from "react-native";
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from "../../../components/GradientBackground";

type ItemCategory = {
  id: string;
  Categoryname: string;
  categoryIndex: number;
};

export default function CategoriasIndex() {
  const db = getFirestore();
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Load categories
  useEffect(() => {
    const q = query(
      collection(db, "itemCategories"),
      orderBy("categoryIndex", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ItemCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ItemCategory, "id">),
      }));

      setCategories(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ⭐ Add new category using Firestore counter
  const addCategory = async () => {
    if (!newCategoryName.trim()) return;

    // 1. Read counter
    const counterRef = doc(db, "counters", "itemCategories");
    const counterSnap = await getDoc(counterRef);

    if (!counterSnap.exists()) {
      alert("Error: counters/itemCategories does not exist.");
      return;
    }

    const nextIndex = counterSnap.data().current;

    // 2. Create new category with this index
    const newId = nextIndex.toString();

    await setDoc(doc(db, "itemCategories", newId), {
      Categoryname: newCategoryName.trim(),
      categoryIndex: nextIndex,
    });

    // 3. Increment counter
    await updateDoc(counterRef, {
      current: nextIndex + 1,
    });

    setNewCategoryName("");
  };

  // ⭐ Fix: update the correct collection (itemCategories)
  const updateCategoryName = async (id: string, name: string) => {
    await updateDoc(doc(db, "itemCategories", id), {
      Categoryname: name,
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
          headerTitle: "Categories",
        }}
      />

      <GradientBackground>
        <View style={{ flex: 1, padding: 20 }}>

          {/* Add Category */}
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
                borderColor: "Black",
                padding: 10,
                borderRadius: 8,
              }}
            />
            <Button_style2 title="Agregar" onPress={addCategory} />
          </View>

          {/* Category List */}
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

                {/* EDIT CATEGORY NAME */}
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
