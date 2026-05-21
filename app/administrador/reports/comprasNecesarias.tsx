import { Stack } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import GradientBackground from "../../../components/GradientBackground";
import { db } from "../../../services/firestore/firebase";
import { Ingredient } from "../../../src/types";

export default function ComprasNecesarias() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseAmounts, setPurchaseAmounts] = useState<Record<string, string>>({});

  // Lista compartida en Firestore
  const [savedList, setSavedList] = useState<any[]>([]);

  // Búsqueda para agregar manualmente
  const [search, setSearch] = useState("");

  // 1. Cargar todos los ingredientes
  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("ingId", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list: Ingredient[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Ingredient, "id">),
      }));

      setIngredients(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 2. Cargar lista compartida de comprasNecesarias
  useEffect(() => {
    const ref = doc(db, "adminReports", "comprasNecesarias");

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as { items?: any[] };
        setSavedList(data.items || []);
      } else {
        setSavedList([]);
      }
    });

    return () => unsub();
  }, []);

  // 3. Ingredientes con bajo inventario
  const lowStock = ingredients
    .filter((ing) => ing.stock <= ing.minStock)
    .sort((a, b) => a.stock - b.stock);

  // 4. Resultados de búsqueda para agregar manualmente
  const filteredSearch = useMemo(() => {
    if (!search.trim()) return [];

    const term = search.toLowerCase();

    return ingredients
      .filter(
        (ing) =>
          ing.name.toLowerCase().includes(term) &&
          !savedList.some((s) => s.id === ing.id)
      )
      .slice(0, 10);
  }, [search, ingredients, savedList]);

  // 5. Guardar lista en Firestore
  const saveList = async (newList: any[]) => {
    const ref = doc(db, "adminReports", "comprasNecesarias");
    await setDoc(ref, { items: newList }, { merge: true });
  };

  // 6. Agregar ingrediente manualmente
  const handleAddManual = (ing: Ingredient) => {
    const newItem = {
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      stock: ing.stock,
      minStock: ing.minStock,
      addedManually: true,
    };

    const newList = [...savedList, newItem];
    saveList(newList);
    setSearch("");
  };

  const processPurchase = async (id: string, amount: number) => {
  try {
    // 1. Update inventory
    const ingRef = doc(db, "ingredients", id);
    const ingSnap = await getDoc(ingRef);

    if (ingSnap.exists()) {
      const ing = ingSnap.data();
      const newStock = (ing.stock || 0) + amount;

      await updateDoc(ingRef, { stock: newStock });
    }

    // 2. Remove from comprasNecesarias list
    const newList = savedList.filter((item) => item.id !== id);
    await saveList(newList);

    // 3. Clear input
    setPurchaseAmounts((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });

  } catch (e) {
    console.log("Error updating inventory:", e);
  }
};

  // 7. Marcar como comprado (eliminar de la lista)
  const handleRemove = async (id: string, suggested: number) => {
  const rawValue = purchaseAmounts[id];

  // If empty, ask user what to do
  if (!rawValue || rawValue.trim() === "") {
    Alert.alert(
      "Cantidad vacía",
      "No ingresaste una cantidad comprada. ¿Deseas usar la cantidad mínima sugerida?",
      [
        {
          text: "Volver",
          style: "cancel",
        },
        {
          text: "Usar sugerida",
          onPress: () => processPurchase(id, suggested),
        },
      ]
    );
    return;
  }

  // If user typed a value, process normally
  const amount = Number(rawValue);
  if (isNaN(amount) || amount <= 0) {
    Alert.alert("Error", "Ingresa una cantidad válida.");
    return;
  }

  processPurchase(id, amount);
};

  // 8. Unir lowStock + lista guardada
  const mergedList = [
    ...lowStock.filter((ing) => !savedList.some((s) => s.id === ing.id)),
    ...savedList,
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Compras Necesarias",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Cargando ingredientes...</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.container}>
            {/* Búsqueda */}
            <TextInput
              style={styles.search}
              placeholder="Agregar ingrediente manualmente..."
              placeholderTextColor="#333"
              value={search}
              onChangeText={setSearch}
            />

            {/* Resultados de búsqueda */}
            {filteredSearch.length > 0 && (
              <View style={styles.searchResults}>
                {filteredSearch.map((ing) => (
                  <TouchableOpacity
                    key={ing.id}
                    style={styles.searchItem}
                    onPress={() => handleAddManual(ing)}
                  >
                    <Text style={styles.searchText}>{ing.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Lista final */}
            {mergedList.length === 0 && (
              <Text style={styles.empty}>No hay ingredientes por comprar</Text>
            )}

            {mergedList.map((ing) => {
              const suggested = Math.max(ing.minStock - ing.stock, 0);

              return (
                <View key={ing.id} style={styles.card}>
                  <Text style={styles.name}>{ing.name}</Text>

                  <Text style={styles.detail}>
                    Inventario actual:{" "}
                    <Text style={styles.bold}>{ing.stock}</Text> {ing.unit}
                  </Text>

                  <Text style={styles.detail}>
                    Inventario mínimo:{" "}
                    <Text style={styles.bold}>{ing.minStock}</Text> {ing.unit}
                  </Text>

                  <Text style={styles.urgent}>
                    Compra sugerida:{" "}
                    <Text style={styles.bold}>
                      {suggested} {ing.unit}
                    </Text>
                  </Text>

                  <Text style={styles.detail}>Cantidad comprada:</Text>

<TextInput
  style={styles.input}
  keyboardType="numeric"
  placeholder="Ingresa cantidad..."
  placeholderTextColor="#555"
  value={purchaseAmounts[ing.id] || ""}
  onChangeText={(val) =>
    setPurchaseAmounts((prev) => ({
      ...prev,
      [ing.id]: val
    }))
  }
/>

                  <TouchableOpacity
                    style={styles.buyButton}
                    onPress={() => handleRemove(ing.id, suggested)}
                  >
                    <Text style={styles.buyText}>Comprado</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },
  loadingContainer: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#444",
  },
  search: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
  },
  searchResults: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    overflow: "hidden",
  },
  searchItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchText: {
    fontSize: 16,
    color: "#333",
  },
  empty: {
    textAlign: "center",
    fontSize: 18,
    color: "#444",
    marginTop: 40,
  },
  card: {
    backgroundColor: "#DDCBAB",
    padding: 16,
    borderRadius: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
    marginBottom: 6,
  },
  detail: {
    fontSize: 15,
    color: "#333",
    marginBottom: 4,
  },
  bold: {
    fontWeight: "700",
    color: "#000",
  },
  urgent: {
    marginTop: 8,
    fontSize: 16,
    color: "#8B0000",
    fontWeight: "600",
  },
  buyButton: {
    marginTop: 10,
    backgroundColor: "#3A2F2F",
    padding: 10,
    borderRadius: 8,
  },
  buyText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  input: {
  backgroundColor: "#fff",
  borderWidth: 1,
  borderColor: "#aaa",
  padding: 8,
  borderRadius: 6,
  marginBottom: 10,
  fontSize: 16,
},
});
