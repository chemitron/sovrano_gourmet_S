import { Stack, useRouter } from "expo-router";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
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

export default function IngredientsAdmin() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("ingId", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Ingredient[];

      setIngredients(list);
    });

    return () => unsub();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Ingredientes",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <Button_style2
            title="Agregar Categoria de Ingrediente"
            onPress={() =>
              router.push("/administrador/ingredientes/categorias")
            }
          />

          <Button_style2
            title="Agregar Ingrediente"
            onPress={() => router.push("/administrador/ingredientes/new")}
          />

          {/* ⭐ SORT ALPHABETICALLY BY NAME */}
          {[...ingredients]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((ing) => (
              <TouchableOpacity
                key={ing.id}
                style={styles.card}
                onPress={() =>
                  router.push({
                    pathname: "/administrador/ingredientes/edit",
                    params: { id: ing.id },
                  })
                }
              >
                <View style={styles.row}>
                  <Text style={styles.name}>{ing.name}</Text>
                  <Text style={styles.unit}>{ing.unit}</Text>
                  <Text style={styles.unit}>ID: {ing.ingId}</Text>
                </View>

                <Text style={styles.sub}>
                  Inventario: {ing.stock} • Min: {ing.minStock} • Costo: $
                  {ing.cost.toFixed(2)}
                </Text>

                {ing.ingCategories?.length > 0 && (
                  <Text style={styles.categories}>
                    Categorías: {ing.ingCategories.join(", ")}
                  </Text>
                )}
              </TouchableOpacity>
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
  categories: {
    marginTop: 6,
    fontSize: 14,
    fontStyle: "italic",
    color: "#666",
  },
});
