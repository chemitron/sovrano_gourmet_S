import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import {
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from "../../../components/GradientBackground";
import { db } from "../../../services/firestore/firebase";
import { Ingredient, ItemCategory } from "../../../src/types";

export default function Inventario() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load ingredients
  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("name", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: Ingredient[] = snap.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Ingredient, "id">),
      }));

      setIngredients(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Load categories
  useEffect(() => {
    const q = query(
      collection(db, "itemCategories"),
      orderBy("categoryIndex", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list: ItemCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<ItemCategory, "id">),
      }));

      setCategories(list);
    });

    return () => unsub();
  }, []);

  if (loading) return null;

  // FILTERING — correct match: categoryId === categoryIndex
  const filtered = ingredients.filter((ing) => {
    const matchesSearch = ing.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === null ||
      ing.categoryId === Number(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  const updateStock = async (id: string) => {
    const newValue = editedValues[id];

    if (!newValue) {
      Alert.alert("Error", "Ingrese un valor válido");
      return;
    }

    const numeric = Number(newValue);
    if (isNaN(numeric)) {
      Alert.alert("Error", "El valor debe ser numérico");
      return;
    }

    await updateDoc(doc(db, "ingredients", id), {
      stock: numeric,
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Inventario",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.container, { paddingBottom: 40 }]}
            keyboardShouldPersistTaps="handled"
          >

            {/* SEARCH BAR */}
            <TextInput
              style={styles.search}
              placeholder="Buscar ingrediente..."
              placeholderTextColor="#777"
              value={search}
              onChangeText={setSearch}
            />

            {/* CATEGORY FILTER */}
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedCategory}
                onValueChange={(v) => setSelectedCategory(v)}
                mode={Platform.OS === "android" ? "dropdown" : undefined}
                style={styles.picker}
                itemStyle={Platform.OS === "ios" ? styles.pickerItem : undefined}
              >
                <Picker.Item label="Todas las categorías" value={null} />
                {categories.map((cat) => (
                  <Picker.Item
                    key={cat.id}
                    label={cat.Categoryname}
                    value={cat.categoryIndex.toString()}
                  />
                ))}
              </Picker>
            </View>

            {/* INGREDIENT LIST */}
            {filtered.map((ing) => (
              <View key={ing.id} style={styles.card}>

                {/* ROW 1 — 2 COLUMNS */}
                <View style={styles.row}>

                  {/* COLUMN 1 */}
                  <View style={styles.col}>
                    <Text style={styles.name}>{ing.name}</Text>

                    <Text style={styles.label}>Balance actual</Text>
                    <Text style={styles.value}>
                      {ing.stock} {ing.unit}
                    </Text>
                  </View>

                  {/* COLUMN 2 */}
                  <View style={styles.col}>
                    <Text style={styles.unit}>{ing.unit}</Text>

                    <Text style={styles.label}>Nuevo balance</Text>
                    <TextInput
                      style={styles.input}
                      keyboardType="numeric"
                      placeholder="Ingrese nuevo balance"
                      value={editedValues[ing.id] ?? ""}
                      onChangeText={(v) =>
                        setEditedValues((prev) => ({ ...prev, [ing.id]: v }))
                      }
                    />
                  </View>

                </View>

                {/* ROW 3 — BUTTON */}
                <View style={styles.buttonWrapper}>
                  <Button_style2
                    title="Guardar"
                    onPress={() => updateStock(ing.id)}
                  />
                </View>

              </View>
            ))}

          </ScrollView>
        </KeyboardAvoidingView>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  search: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
  },
  picker: {
    color: "#000",
  },
  pickerItem: {
    color: "#000",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    gap: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  col: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  unit: {
    fontSize: 16,
    color: "#444",
    marginBottom: 6,
    textAlign: "right",
  },
  label: {
    fontSize: 14,
    color: "#555",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginTop: 4,
  },
  input: {
    marginTop: 4,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  buttonWrapper: {
    marginTop: 10,
  },
});
