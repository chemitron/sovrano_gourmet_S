import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
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

export default function EditMenuItem() {
  const { itemId } = useLocalSearchParams();
  const db = getFirestore();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [itemName, setItemName] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [priceCustomer, setPriceCustomer] = useState("");
  const [priceEmployee, setPriceEmployee] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [soloEmpleado, setSoloEmpleado] = useState(false);

  // Load categories
  useEffect(() => {
    const q = query(
      collection(db, "menuCategories"),
      orderBy("categoryIndex", "asc")
    );
//console.log(`🟦 [edit_menu_items] Creating listener for order`);
    const unsub = onSnapshot(q, (snapshot) => {
      const list: MenuCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<MenuCategory, "id">),
      }));
      //console.log(`🟩 [edit_menu_items] Snapshot fired for order`);
      setCategories(list);
    });

    return () => {
      //console.log(`🟧 [edit_menu_items] Cleaning listener for order`);
      unsub();
    };
  }, []);

  // Load item data
  useEffect(() => {
    const loadItem = async () => {
      const snap = await getDoc(doc(db, "menuItems", String(itemId)));
      const data = snap.data();

      if (!data) return;

      setItemName(data.ItemName);
      setDescription(data.description);
      setPrepTime(String(data.prepTime));
      setPriceCustomer(String(data.priceCustomer));
      setPriceEmployee(String(data.priceEmployee));
      setSelectedCategory(String(data.categoryId));
      setImageUri(data.imageUrl);
      setIsAvailable(data.isAvailable);
      setLoading(false);
    };

    loadItem();
  }, [itemId]);

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

  const uploadImageAsync = async (uri: string) => {
    const storage = getStorage();
    const imageRef = ref(storage, `menuItems/${itemId}.jpg`);

    const response = await fetch(uri);
    const blob = await response.blob();

    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const saveChanges = async () => {
    if (!selectedCategory) return alert("Seleccione categoría");

    setSaving(true);

    let finalImageUrl = imageUri;

    // If the image is local, upload it
    if (imageUri && imageUri.startsWith("file")) {
      finalImageUrl = await uploadImageAsync(imageUri);
    }

    await updateDoc(doc(db, "menuItems", String(itemId)), {
  ItemName: itemName.trim(),
  description: description.trim(),
  prepTime: Number(prepTime),
  priceCustomer: Number(priceCustomer), 
  priceEmployee: Number(priceEmployee),
  categoryId: Number(selectedCategory),
  imageUrl: finalImageUrl,
  isAvailable: isAvailable,
  soloEmpleado,
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
      <Stack.Screen options={{ headerTitle: "Editar Plato" }} />

      <GradientBackground>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {/* CATEGORY */}
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
      value={cat.id}
    />
  ))}
</Picker>

            </View>

            {/* NAME */}
            <TextInput
              placeholder="Nombre del item"
              value={itemName}
              onChangeText={setItemName}
              style={styles.input}
            />

            {/* DESCRIPTION */}
            <TextInput
              placeholder="Descripción"
              value={description}
              onChangeText={setDescription}
              style={[styles.input, { height: 80 }]}
              multiline
            />
<View style={styles.rowBetween}>
  {/* SOLO EMPLEADO */}
  <View style={styles.column}>
    <Text style={styles.label}>Solo empleado</Text>
    <Switch
      value={soloEmpleado}
      onValueChange={setSoloEmpleado}
    />
  </View>

  {/* PREP TIME */}
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


            <View style={styles.priceRow}>
  {/* Customer Price */}
  <View style={styles.priceColumn}>
    <Text style={styles.label}>Precio cliente</Text>
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
  </View>

  {/* Employee Price */}
  <View style={styles.priceColumn}>
    <Text style={styles.label}>Precio empleado</Text>
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
  </View>
</View>


            <View style={{ marginBottom: 5 }}>

  <View
    style={{
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
    }}
  >
    <Text style={{ fontSize: 16 }}>
      {isAvailable ? "Disponible" : "No disponible"}
    </Text>

    <TouchableOpacity
      onPress={() => setIsAvailable(!isAvailable)}
      style={{
        backgroundColor: isAvailable ? "#4CAF50" : "#B71C1C",
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
      }}
    >
      <Text style={{ color: "white", fontWeight: "bold" }}>
        {isAvailable ? "Activo" : "Inactivo"}
      </Text>
    </TouchableOpacity>
  </View>
</View>
{/* CURRENT IMAGE PREVIEW */}
{imageUri ? (
  <Image
    source={{ uri: imageUri }}
    style={{
      width: 140,
      height: 140,
      borderRadius: 10,
      alignSelf: "center",
      marginBottom: 16,
      backgroundColor: "#eee",
    }}
  />
) : (
  <View
    style={{
      width: 140,
      height: 140,
      borderRadius: 10,
      alignSelf: "center",
      marginBottom: 16,
      backgroundColor: "#ccc",
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#666" }}>Sin imagen</Text>
  </View>
)}

            {/* IMAGE */}
            <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
              <Text style={styles.imageButtonText}>Cambiar imagen</Text>
            </TouchableOpacity>

            {/* SAVE */}
            <TouchableOpacity
              style={styles.saveButton}
              onPress={saveChanges}
              disabled={saving}
            >
              <Text style={styles.saveButtonText}>
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
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
  row: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 12,
},

priceRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  gap: 12, // optional, for spacing
},

priceColumn: {
  flex: 1,
},

rowBetween: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
},

column: {
  flex: 1,
},

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
