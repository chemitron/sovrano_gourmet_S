import { Picker } from "@react-native-picker/picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
    collection,
    deleteDoc,
    doc,
    getDoc,
    getFirestore,
    onSnapshot,
    orderBy,
    query,
    setDoc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from "../../../components/GradientBackground";
import { Ingredient } from "../../../src/types";

export default function ItemIngredients() {
  // ⭐ FIX: Expo Router lowercases params unless file is [ItemId].tsx
  const { ItemId, itemId } = useLocalSearchParams();
  const menuItemId = (ItemId ?? itemId) as string;

  const router = useRouter();
  const db = getFirestore();

  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [assignedIngredients, setAssignedIngredients] = useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [loading, setLoading] = useState(true);

  // Load all ingredients for the picker
  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("ingId", "asc"));

    const unsub = onSnapshot(q, (snapshot) => {
      const list: Ingredient[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Ingredient, "id">),
      }));

      setIngredients(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Load assigned ingredients for this menu item
  useEffect(() => {
    const q = collection(db, "menuItems", menuItemId, "ingredients");

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      setAssignedIngredients(list);
    });

    return () => unsub();
  }, []);

  // Load existing ingredient assignment when selecting from picker
  useEffect(() => {
    const loadExisting = async () => {
      if (!selectedIngredient) return;

      const ref = doc(
        db,
        "menuItems",
        menuItemId,
        "ingredients",
        selectedIngredient
      );

      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setQty(String(data.qty_needed));
      } else {
        setQty("");
      }
    };

    loadExisting();
  }, [selectedIngredient]);

  const saveIngredient = async () => {
    if (!selectedIngredient) {
      Alert.alert("Error", "Seleccione un ingrediente");
      return;
    }

    if (!qty.trim()) {
      Alert.alert("Error", "Ingrese la cantidad necesaria");
      return;
    }

    const ingredient = ingredients.find((i) => i.id === selectedIngredient);
    if (!ingredient) return;

    const ref = doc(
      db,
      "menuItems",
      menuItemId,
      "ingredients",
      selectedIngredient
    );

    await setDoc(ref, {
      ingId: ingredient.ingId,
      name: ingredient.name,
      unit: ingredient.unit,
      qty_needed: Number(qty),
    });

    Alert.alert("Éxito", "Ingrediente guardado correctamente");
  };

  const deleteIngredient = async (id: string) => {
    Alert.alert("Confirmar", "¿Eliminar este ingrediente del plato?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteDoc(doc(db, "menuItems", menuItemId, "ingredients", id));
        },
      },
    ]);
  };

  if (loading) return null;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Ingredientes del Plato",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={80}
        >
          <FlatList
            data={[]}
            renderItem={() => null}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 140 }}
            ListHeaderComponent={
              <View style={{ padding: 20 }}>

                {/* CURRENT INGREDIENTS */}
                <Text style={styles.sectionTitle}>Ingredientes actuales</Text>

                {assignedIngredients.length === 0 && (
                  <Text style={{ color: "#000" }}>No hay ingredientes asignados.</Text>
                )}

                {assignedIngredients.map((ing) => (
                  <TouchableOpacity
                    key={ing.id}
                    style={styles.ingRow}
                    onPress={() => {
                      setSelectedIngredient(ing.id);
                      setQty(String(ing.qty_needed));
                    }}
                  >
                    <View>
                      <Text style={styles.ingName}>{ing.name}</Text>
                      <Text style={styles.ingDetails}>
                        {ing.qty_needed} {ing.unit}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => deleteIngredient(ing.id)}
                      style={styles.deleteButton}
                    >
                      <Text style={{ color: "white", fontWeight: "bold" }}>X</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                ))}

                {/* ADD / EDIT */}
                <Text style={styles.sectionTitle}>Agregar / Editar ingrediente</Text>

                {/* PICKER */}
                <Text style={styles.label}>Ingrediente</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedIngredient}
                    onValueChange={(v) => setSelectedIngredient(v)}
                    mode={Platform.OS === "android" ? "dropdown" : undefined}
                    style={styles.picker}
                    itemStyle={Platform.OS === "ios" ? styles.pickerItem : undefined}
                  >
                    <Picker.Item label="Seleccione ingrediente" value={null} />
                    {ingredients.map((ing) => (
                      <Picker.Item
                        key={ing.id}
                        label={`${ing.name} (${ing.unit})`}
                        value={ing.id}
                      />
                    ))}
                  </Picker>
                </View>

                {/* QUANTITY */}
                <Text style={styles.label}>Cantidad necesaria</Text>
                <TextInput
                  style={styles.input}
                  value={qty}
                  onChangeText={setQty}
                  keyboardType="numeric"
                  placeholder="Ej: 50"
                  placeholderTextColor="#555"
                />

                <Button_style2 title="Guardar" onPress={saveIngredient} />

              </View>
            }
          />
        </KeyboardAvoidingView>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 10,
  },

  ingRow: {
    backgroundColor: "#DDCBAB",
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  ingName: { fontSize: 16, fontWeight: "600", color: "#000" },
  ingDetails: { fontSize: 14, color: "#333" },

  deleteButton: {
    backgroundColor: "red",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },

  label: { fontSize: 16, fontWeight: "600", color: "#000" },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    color: "#000",
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
  },

  pickerItem: {
    color: "#000",
    fontSize: 16,
  },
});
