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

  // Search filter
  useEffect(() => {
    if (search.trim() === "") {
      setFiltered(ingredients);
    } else {
      const s = search.toLowerCase();
      setFiltered(
        ingredients.filter((ing) =>
          ing.name.toLowerCase().includes(s)
        )
      );
    }
  }, [search, ingredients]);

  // Add ingredient to replenishment list
  const addToList = (ing: Ingredient) => {
    if (selected.find((s) => s.ingredient.id === ing.id)) return;

    // Auto-suggest quantity based on minStock
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

          {/* SEARCH BAR */}
          <TextInput
            style={styles.search}
            placeholder="Buscar ingrediente..."
            value={search}
            onChangeText={setSearch}
          />

          <Button_style2
            title="Re-abastecer"
            onPress={replenishAll}
          />

          <Text style={styles.sectionTitle}>Selecciona ingredientes</Text>

          {filtered.map((ing) => (
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

          {selected.length > 0 && (
            <>
              {selected.map((item) => (
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
            </>
          )}

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

  search: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    fontSize: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
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
