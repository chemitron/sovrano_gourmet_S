import { Stack } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import GradientBackground from "../../../components/GradientBackground";
import { db } from "../../../services/firestore/firebase";
import { Ingredient } from "../../../src/types";

export default function ComprasNecesarias() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("ingId", "asc"));

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

  if (loading) return null;

  // Filter ingredients that need restocking
  const lowStock = ingredients.filter(
    (ing) => ing.stock <= ing.minStock
  );

  // Sort by urgency (lowest stock first)
  lowStock.sort((a, b) => a.stock - b.stock);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Compras Necesarias",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          {lowStock.length === 0 && (
            <Text style={styles.empty}>No hay ingredientes por comprar</Text>
          )}

          {lowStock.map((ing) => (
            <View key={ing.id} style={styles.card}>
              <Text style={styles.name}>{ing.name}</Text>

              <Text style={styles.detail}>
                Inventario actual: <Text style={styles.bold}>{ing.stock}</Text> {ing.unit}
              </Text>

              <Text style={styles.detail}>
                Inventario mínimo: <Text style={styles.bold}>{ing.minStock}</Text> {ing.unit}
              </Text>

              <Text style={styles.urgent}>
                Compra minima:{" "}
                <Text style={styles.bold}>
                  {Math.max(ing.minStock, 0)} {ing.unit}
                </Text>
              </Text>
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
});
