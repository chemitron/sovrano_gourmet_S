import { Stack } from "expo-router";
import {
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from "../../../components/GradientBackground";
import { db } from "../../../services/firestore/firebase";

type Ingredient = {
  id: string;
  ingId: number;
  name: string;
  unit: string;
  cost: number;
  stock: number;
  minStock: number;
  ingCategories: string[];
};

type ReplenishItem = {
  ingredient: Ingredient;
  qty: string;
};

export default function ReplenishmentScreen() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [filtered, setFiltered] = useState<Ingredient[]>([]);
  const [selected, setSelected] = useState<ReplenishItem[]>([]);
  const [search, setSearch] = useState("");

  // NEW: UI filter state
  const [viewMode, setViewMode] = useState<"all" | "selected">("all");

  const normalize = (str: string) =>
    str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  // Load ingredients
  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("ingId", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Ingredient[];
      setIngredients(list);
      setFiltered(list);
    });

    return () => unsub();
  }, []);

  // Search filter (only affects "all" mode)
  useEffect(() => {
    if (viewMode === "selected") return;

    if (search.trim() === "") {
      setFiltered(ingredients);
    } else {
      const s = normalize(search);

      setFiltered(
        ingredients.filter((ing) =>
          normalize(ing.name).includes(s)
        )
      );
    }
  }, [search, ingredients, viewMode]);

  // Add ingredient to replenishment list
  const addToList = (ing: Ingredient) => {
    if (selected.find((s) => s.ingredient.id === ing.id)) return;

    const suggested =
      ing.stock < ing.minStock ? String(ing.minStock - ing.stock) : "";

    setSelected([...selected, { ingredient: ing, qty: suggested }]);
  };

  // Update quantity
  const updateQty = (id: string, qty: string) => {
    setSelected((prev) =>
      prev.map((item) =>
        item.ingredient.id === id ? { ...item, qty } : item
      )
    );
  };

  // Perform replenishment
  const replenishAll = async () => {
    if (selected.length === 0) {
      Alert.alert("Nada seleccionado", "Selecciona ingredientes primero.");
      return;
    }

    try {
      for (const item of selected) {
        const amount = Number(item.qty);
        if (isNaN(amount) || amount <= 0) continue;

        const ref = doc(db, "ingredients", item.ingredient.id);
        await updateDoc(ref, {
          stock: increment(amount),
        });
      }

      Alert.alert("Éxito", "Inventario actualizado.");
      setSelected([]);

    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar el inventario.");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Re-abastecer Ingredientes",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>

          {/* FILTER BUTTONS */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                viewMode === "all" && styles.filterButtonActive,
              ]}
              onPress={() => setViewMode("all")}
            >
              <Text
                style={[
                  styles.filterText,
                  viewMode === "all" && styles.filterTextActive,
                ]}
              >
                Todos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                viewMode === "selected" && styles.filterButtonActive,
              ]}
              onPress={() => setViewMode("selected")}
            >
              <Text
                style={[
                  styles.filterText,
                  viewMode === "selected" && styles.filterTextActive,
                ]}
              >
                Seleccionados
              </Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR (only in "all" mode) */}
          {viewMode === "all" && (
            <TextInput
              style={styles.search}
              placeholder="Buscar ingrediente..."
              value={search}
              onChangeText={setSearch}
            />
          )}

          <Button_style2
            title="Re-abastecer"
            onPress={replenishAll}
          />

          {/* ALL INGREDIENTS LIST */}
          {viewMode === "all" &&
            filtered.map((ing) => (
              <TouchableOpacity
                key={ing.id}
                style={styles.card}
                onPress={() => addToList(ing)}
              >
                <View style={styles.row}>
                  <Text style={styles.name}>{ing.name}</Text>
                  <Text style={styles.unit}>{ing.unit}</Text>
                </View>

                <Text style={styles.sub}>
                  Inventario: {ing.stock} • Min: {ing.minStock}
                </Text>
              </TouchableOpacity>
            ))}

          {/* SELECTED INGREDIENTS LIST */}
          {viewMode === "selected" &&
            selected.map((item) => (
              <View key={item.ingredient.id} style={styles.selectedCard}>
                <Text style={styles.selectedName}>{item.ingredient.name}</Text>

                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Cantidad"
                  value={item.qty}
                  onChangeText={(v) => updateQty(item.ingredient.id, v)}
                />

                {item.ingredient.stock < item.ingredient.minStock && (
                  <Text style={styles.suggest}>
                    Sugerido: {item.ingredient.minStock - item.ingredient.stock}
                  </Text>
                )}
              </View>
            ))}

        </ScrollView>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 20,
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  filterButton: {
    flex: 1,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ddd",
    marginHorizontal: 5,
    alignItems: "center",
  },

  filterButtonActive: {
    backgroundColor: "#3A2F2F",
  },

  filterText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },

  filterTextActive: {
    color: "white",
  },

  search: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
  },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  name: {
    fontSize: 18,
    fontWeight: "700",
  },

  unit: {
    fontSize: 16,
    color: "#444",
  },

  sub: {
    marginTop: 4,
    fontSize: 14,
    color: "#555",
  },

  selectedCard: {
    backgroundColor: "#f0f0f0",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ccc",
  },

  selectedName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
    fontSize: 16,
  },

  suggest: {
    marginTop: 6,
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
});
