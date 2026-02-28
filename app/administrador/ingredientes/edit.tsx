import { Picker } from "@react-native-picker/picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  deleteDoc,
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

export default function EditIngredient() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [ingId, setIngId] = useState<number>(0);
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");

  // Category dropdown
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Load ingredient data
  useEffect(() => {
    const load = async () => {
      const ref = doc(db, "ingredients", id as string);
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        Alert.alert("Error", "Ingrediente no encontrado");
        router.back();
        return;
      }

      const data = snap.data();
      setIngId(data.ingId);
      setName(data.name);
      setUnit(data.unit);
      setCost(String(data.cost));
      setStock(String(data.stock));
      setMinStock(String(data.minStock));

      if (data.categoryId !== undefined) {
        setSelectedCategory(String(data.categoryId));
      }

      setLoading(false);
    };

    load();
  }, []);

  // Load itemCategories for dropdown (FIXED: using db)
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

  const saveChanges = async () => {
    if (!selectedCategory) {
      Alert.alert("Error", "Seleccione una categoría");
      return;
    }

    const ref = doc(db, "ingredients", id as string);

    await updateDoc(ref, {
      name,
      unit,
      cost: Number(cost),
      stock: Number(stock),
      minStock: Number(minStock),
      categoryId: Number(selectedCategory),
    });

    router.back();
  };

  const deleteIngredient = async () => {
    Alert.alert("Confirmar", "¿Eliminar este ingrediente?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "ingredients", id as string));
          router.back();
        },
      },
    ]);
  };

  if (loading) return null;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Editar Ingrediente",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>ID: {ingId}</Text>

          <Text style={styles.label}>Nombre</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />

          <Text style={styles.label}>Unidad</Text>
          <TextInput style={styles.input} value={unit} onChangeText={setUnit} />

          <Text style={styles.label}>Costo</Text>
          <TextInput
            style={styles.input}
            value={cost}
            onChangeText={setCost}
            keyboardType="numeric"
          />

          <Text style={styles.label}>Stock</Text>
          <TextInput
            style={styles.input}
            value={stock}
            onChangeText={setStock}
            keyboardType="numeric"
          />

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

          <Button_style2 title="Guardar Cambios" onPress={saveChanges} />

          <View style={{ marginTop: 20 }}>
            <Button_style2
              title="Eliminar Ingrediente"
              onPress={deleteIngredient}
            />
          </View>
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
