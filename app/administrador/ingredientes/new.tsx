import { Picker } from "@react-native-picker/picker";
import { Stack, useRouter } from "expo-router";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
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
import { ItemCategory } from "../../../src/types";

export default function NewIngredient() {
  const router = useRouter();

  const [ingId, setIngId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");

  // Category dropdown state
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load next ingredient ID
  useEffect(() => {
    const loadCounter = async () => {
      const ref = doc(db, "counters", "ingredients");
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        Alert.alert("Error", "No existe counters/ingredients en Firestore");
        return;
      }

      const next = snap.data().current;
      setIngId(next);
    };

    loadCounter();
  }, []);

  // Load itemCategories for dropdown (FIXED: using db instead of getFirestore())
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

  const saveIngredient = async () => {
    if (!name || !unit) {
      Alert.alert("Error", "Nombre y unidad son obligatorios");
      return;
    }

    if (!selectedCategory) {
      Alert.alert("Error", "Seleccione una categoría");
      return;
    }

    if (ingId === null) {
      Alert.alert("Error", "No se pudo obtener el ID del ingrediente");
      return;
    }

    // Create ingredient
    await addDoc(collection(db, "ingredients"), {
      ingId,
      name,
      unit,
      cost: Number(cost) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      categoryId: Number(selectedCategory),
    });

    // Increment counter
    const counterRef = doc(db, "counters", "ingredients");
    await updateDoc(counterRef, {
      current: ingId + 1,
    });

    router.back();
  };

  if (ingId === null) return null;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Nuevo Ingrediente",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>ID Automático: {ingId}</Text>

          {/* NAME */}
          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          {/* UNIT */}
          <Text style={styles.label}>Unidad (g, ml, unidad, etc.)</Text>
          <TextInput style={styles.input} value={unit} onChangeText={setUnit} />

          {/* COST */}
          <Text style={styles.label}>Costo por unidad</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />

          {/* STOCK */}
          <Text style={styles.label}>Stock inicial</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
          />

          {/* MIN STOCK */}
          <Text style={styles.label}>Stock mínimo</Text>
          <TextInput
            style={styles.input}
            value={minStock}
            onChangeText={setMinStock}
            keyboardType="numeric"
          />

          {/* CATEGORY DROPDOWN */}
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedCategory}
              onValueChange={(v) => setSelectedCategory(v)}
              mode={Platform.OS === "android" ? "dropdown" : undefined}
              style={styles.picker}
              itemStyle={Platform.OS === "ios" ? styles.pickerItem : undefined}
            >
              <Picker.Item label="Seleccione categoría" value={null} />
              {categories.map((cat) => (
                <Picker.Item
                  key={cat.id}
                  label={cat.Categoryname}
                  value={cat.categoryIndex.toString()}
                />
              ))}
            </Picker>
          </View>

          <Button_style2 title="Guardar" onPress={saveIngredient} />
        </ScrollView>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },
  label: { fontSize: 16, fontWeight: "600" },
  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
  },
  picker: {
    color: "#000",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
  },
  pickerItem: {
    color: "#000",
    fontSize: 16,
  },
});
