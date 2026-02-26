import { Audio } from "expo-av";
import { Stack } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import { db } from "../../services/firestore/firebase";
import { Order } from "../../src/types";

export default function ChefOrdenes() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const getElapsed = (createdAt: any) => {
    if (!createdAt) return "";

    const created = createdAt.toDate().getTime();
    const diff = Math.floor((now - created) / 1000);

    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const isRush = (createdAt: any) => {
    if (!createdAt) return false;
    const created = createdAt.toDate().getTime();
    const diff = now - created;
    return diff >= 15 * 60 * 1000;
  };

  const playNewOrderSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/bell_sound.mp3")
      );
      await sound.playAsync();
    } catch (e) {
      console.log("Sound error:", e);
    }
  };

  const playCancelSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/cancel_sound.mp3")
      );
      await sound.playAsync();
    } catch (e) {
      console.log("Cancel sound error:", e);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("paymentStatus", "==", "charged"),
      where("approvalStatus", "==", "aprobado"),
      where("served", "==", false)
    );

    const unsub = onSnapshot(q, (snap) => {
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Order[];

  // Detect NEW orders by ID
  const newIds = list
    .map((o) => o.id)
    .filter((id) => !knownOrderIds.has(id));

  if (newIds.length > 0) {
    playNewOrderSound();
  }

  // Detect canceled orders
  list.forEach((order) => {
    const prev = orders.find((o) => o.id === order.id);
    if (prev && prev.status !== "cancelado" && order.status === "cancelado") {
      playCancelSound();
    }
  });

  // Update known IDs
  setKnownOrderIds(new Set(list.map((o) => o.id)));

  setOrders(list);
});

    return () => unsub();
  }, []);

  const markStarted = async (orderId: string) => {
    try {
      const orderRef = doc(db, "orders", orderId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return;

      const order = orderSnap.data();

      for (const item of order.items || []) {
        const menuItemId = item.itemId;
        const itemQty = item.qty;

        const ingCol = collection(
          db,
          "menuItems",
          String(menuItemId),
          "ingredients"
        );
        const ingSnap = await getDocs(ingCol);

        for (const ingDoc of ingSnap.docs) {
          const ingData = ingDoc.data();
          const ingredientId = ingDoc.id;

          const totalNeeded = ingData.qty_needed * itemQty;

          const globalIngRef = doc(db, "ingredients", ingredientId);

          await runTransaction(db, async (transaction) => {
            const globalSnap = await transaction.get(globalIngRef);
            if (!globalSnap.exists()) return;

            const currentStock = globalSnap.data().stock || 0;
            const newStock = Math.max(0, currentStock - totalNeeded);

            transaction.update(globalIngRef, { stock: newStock });
          });
        }
      }

      await updateDoc(orderRef, {
        empezada: true,
        status: "empezada",
        startedAt: new Date(),
      });
    } catch (e) {
      console.log("Inventory deduction error:", e);
      Alert.alert("Error", "No se pudo descontar inventario");
    }
  };

  const markServida = async (orderId: string, createdAt: any) => {
    const start = createdAt.toDate().getTime();
    const end = Date.now();

    const diffMs = end - start;
    const diffMinutes = Math.round(diffMs / 60000);

    await updateDoc(doc(db, "orders", orderId), {
      served: true,
      status: "servida",
      servedAt: new Date(),
      duracion: diffMinutes,
    });
  };

  const markCancelada = async (orderId: string) => {
    await updateDoc(doc(db, "orders", orderId), {
      status: "cancelado",
      served: true,
      canceledAt: new Date(),
    });
    playCancelSound();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Órdenes en Cocina",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          {orders.length === 0 && (
            <Text style={styles.empty}>No hay órdenes pendientes</Text>
          )}

          {orders.map((order) => (
            <View
              key={order.id}
              style={[
                styles.card,
                order.empezada && styles.cardStarted,
                isRush(order.createdAt) && styles.cardRush,
                order.status === "cancelado" && styles.cardCanceled,
              ]}
            >
              <View style={styles.rowSplit}>
                {/* LEFT SIDE */}
                <View style={styles.leftSide}>
                  <Text style={styles.headerText}>
                    Orden #{order.orderNumber} •{" "}
                    {order.username ?? "Sin nombre"} • {order.estacion} •{" "}
                    {getElapsed(order.createdAt)}
                  </Text>

                  {order.items?.map((item, i) => (
                    <Text key={i} style={styles.item}>
                      {item.qty} × {item.ItemName}
                    </Text>
                  ))}
                </View>

                {/* RIGHT SIDE — CLEAN, NO DUPLICATES */}
                <View style={styles.rightSide}>
                  {/* CANCELED */}
                  {order.status === "cancelado" && (
                    <Button_style2
                      title="Cancelada"
                      onPress={() => markCancelada(order.id)}
                    />
                  )}

                  {/* NOT STARTED */}
                  {!order.empezada && order.status !== "cancelado" && (
                    <Button_style2
                      title="Empezada"
                      onPress={() => markStarted(order.id)}
                    />
                  )}

                  {/* STARTED */}
                  {order.empezada && order.status !== "cancelado" && (
                    <Button_style2
                      title="Servida"
                      onPress={() => markServida(order.id, order.createdAt)}
                    />
                  )}
                </View>
              </View>
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
    color: "#555",
  },
  card: {
    backgroundColor: "#f5f1e8",
    padding: 15,
    borderRadius: 12,
  },
  cardStarted: {
    backgroundColor: "#d7f8d0",
  },
  cardRush: {
    borderWidth: 2,
    borderColor: "#ff4d4d",
  },
  rowSplit: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  leftSide: {
    flex: 3,
    paddingRight: 10,
  },
  rightSide: {
    flex: 1,
    gap: 10,
    justifyContent: "flex-start",
  },
  headerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  item: {
    fontSize: 15,
    marginBottom: 3,
  },
  cardCanceled: {
    backgroundColor: "#ffdddd",
    borderColor: "#ff4444",
    borderWidth: 2,
  },
});
