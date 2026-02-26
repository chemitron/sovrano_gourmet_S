import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
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
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import GradientBackground from "../../../components/GradientBackground";

type MenuCategory = {
  id: string;
  Categoryname: string;
  categoryIndex: number;
};

export default function AddMenuItem() {
  const db = getFirestore();

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [priceCustomer, setPriceCustomer] = useState("");
  const [priceEmployee, setPriceEmployee] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [soloEmpleado, setSoloEmpleado] = useState(false);

  // Load categories
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const uploadImageAsync = async (uri: string, newId: string) => {
    const storage = getStorage();
    const imageRef = ref(storage, `menuItems/${newId}.jpg`);

    const response = await fetch(uri);
    const blob = await response.blob();

    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  // ⭐ SAVE ITEM using counters/menuItems/current
  const saveItem = async () => {
    if (!selectedCategory) return alert("Seleccione una categoría");
    if (!itemName.trim()) return alert("Ingrese nombre");
    if (!priceCustomer.trim()) return alert("Ingrese precio");
    if (!priceEmployee.trim()) return alert("Ingrese precio");

    setSaving(true);

    // ⭐ 1. Read counter
    const counterRef = doc(db, "counters", "menuItems");
    const counterSnap = await getDoc(counterRef);

    if (!counterSnap.exists()) {
      alert("Error: counters/menuItems no existe");
      setSaving(false);
      return;
    }

    const nextIndex = counterSnap.data().current;
    const newId = nextIndex.toString();

    // ⭐ 2. Upload image (optional)
    let downloadUrl = "";
    if (imageUri) {
      downloadUrl = await uploadImageAsync(imageUri, newId);
    }

    // ⭐ 3. Create menu item
    await setDoc(doc(db, "menuItems", newId), {
      ItemName: itemName.trim(),
      description: description.trim(),
      prepTime: Number(prepTime),
      priceCustomer: Number(priceCustomer),
      priceEmployee: Number(priceEmployee),
      imageUrl: downloadUrl,
      isAvailable: true,
      itemIndex: nextIndex,
      categoryId: Number(selectedCategory),
      soloEmpleado,
    });

    // ⭐ 4. Increment counter
    await updateDoc(counterRef, {
      current: nextIndex + 1,
    });

    setSaving(false);
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: "Agregar Item" }} />

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
            contentContainerStyle={{ paddingBottom: 80 }}
            ListHeaderComponent={
              <View style={{ padding: 20 }}>
                {/* CATEGORY */}
                <Text style={styles.label}>Categoría</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={selectedCategory}
                    onValueChange={(v) => setSelectedCategory(v)}
                    style={{ color: "#000" }}
                    itemStyle={{ color: "#000" }}
                  >
                    <Picker.Item label="Seleccione categoría" value={null} />
                    {categories.map((cat) => (
                      <Picker.Item
                        key={cat.id}
                        label={cat.Categoryname}
                        value={cat.id}
                      />
                    ))}
                  </Picker>
                </View>

                {/* NAME */}
                <TextInput
                  placeholder="Nombre del plato"
                  placeholderTextColor="#000"
                  value={itemName}
                  onChangeText={setItemName}
                  style={styles.input}
                />

                {/* DESCRIPTION */}
                <TextInput
                  placeholder="Descripción"
                  placeholderTextColor="#000"
                  value={description}
                  onChangeText={setDescription}
                  style={[styles.input, { height: 80 }]}
                  multiline
                />

                {/* SOLO EMPLEADO + PREP TIME */}
                <View style={styles.rowBetween}>
                  <View style={styles.column}>
                    <Text style={styles.label}>Solo empleado</Text>
                    <Switch value={soloEmpleado} onValueChange={setSoloEmpleado} />
                  </View>

                  <View style={[styles.column, { alignItems: "flex-end" }]}>
                    <Text style={styles.label}>Tiempo de preparación</Text>

                    <View style={styles.prepRow}>
                      <TextInput
                        placeholder="Tiempo"
                        placeholderTextColor="#000"
                        value={prepTime}
                        onChangeText={setPrepTime}
                        keyboardType="numeric"
                        style={[styles.input, { flex: 1 }]}
                      />
                      <Text style={styles.unitLabel}>min</Text>
                    </View>
                  </View>
                </View>

                {/* PRICE */}
                <Text style={{ textAlign: "center", marginBottom: 10 }}>
                    Precio cliente
                  </Text>
                <TextInput
                  placeholder="$ Precio cliente"
                  placeholderTextColor="#000"
                  value={priceCustomer ? `$${priceCustomer}` : ""}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9.]/g, "");
                    setPriceCustomer(numeric);
                  }}
                  keyboardType="numeric"
                  style={styles.input}
                />
                <Text style={{ textAlign: "center", marginBottom: 10 }}>
                    Precio empleado
                  </Text>
                <TextInput
                  placeholder="$ Precio empleado"
                  placeholderTextColor="#000"
                  value={priceEmployee ? `$${priceEmployee}` : ""}
                  onChangeText={(text) => {
                    const numeric = text.replace(/[^0-9.]/g, "");
                    setPriceEmployee(numeric);
                  }}
                  keyboardType="numeric"
                  style={styles.input}
                />

                {/* IMAGE */}
                <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                  <Text style={styles.imageButtonText}>
                    {imageUri ? "Cambiar imagen" : "Seleccionar imagen"}
                  </Text>
                </TouchableOpacity>

                {imageUri && (
                  <Text style={{ textAlign: "center", marginBottom: 10 }}>
                    Imagen seleccionada ✔
                  </Text>
                )}

                {/* SAVE */}
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveItem}
                  disabled={saving}
                >
                  <Text style={styles.saveButtonText}>
                    {saving ? "Guardando..." : "Guardar Item"}
                  </Text>
                </TouchableOpacity>
              </View>
            }
          />
        </KeyboardAvoidingView>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  label: { fontWeight: "bold", marginBottom: 6 },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "black",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "white",
  },
  imageButton: {
    backgroundColor: "#444",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  imageButtonText: { color: "white", textAlign: "center" },
  saveButton: {
    backgroundColor: "black",
    padding: 14,
    borderRadius: 10,
  },
  saveButtonText: { color: "white", textAlign: "center", fontSize: 18 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  column: { flex: 1 },
  prepRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
  },
});
