import { Audio } from "expo-av";
import { Stack } from "expo-router";
import * as ScreenOrientation from "expo-screen-orientation";
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
import { useEffect, useRef, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import { db } from "../../services/firestore/firebase";
import { Order } from "../../src/types";

export default function ChefOrdenes() {
  const [orders, setOrders] = useState<Order[]>([]);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const [knownOrderIds, setKnownOrderIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const getElapsed = (createdAt: any) => {
  if (!createdAt) return "";

  const created = createdAt.toDate().getTime();
  const diffMs = now - created;

  const minutes = Math.floor(diffMs / 60000); // ⭐ minutes only

  return `${minutes}m`;
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
    }
  };

  const playCancelSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/sounds/cancel_sound.mp3")
      );
      await sound.playAsync();
    } catch (e) {
    }
  };

const isStaffOrder = (order: Order) => {
  const role = order.role || "";
  return role === "empleado" || role === "admin" || role === "recepcion";
};

const staffOrders = orders.filter(isStaffOrder);
const otherOrders = orders.filter((o) => !isStaffOrder(o));


  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  return () => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  };
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

    const currentIds = new Set(list.map((o) => o.id));
    const previousIds = knownOrderIdsRef.current;

    // NEW ORDERS = IDs in current snapshot but not in previous snapshot
    const newIds = [...currentIds].filter((id) => !previousIds.has(id));

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

    // Update ref (instant, no re-render)
    knownOrderIdsRef.current = currentIds;

    // Update UI state
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

  // ⭐ Sorting helpers
const sortByUsername = (a: Order, b: Order) => {
  const nameA = (a.username ?? "").trim().toLowerCase();
  const nameB = (b.username ?? "").trim().toLowerCase();
  return nameA.localeCompare(nameB);
};

const sortByClientName = (a: Order, b: Order) => {
  const nameA = (
    a.username?.trim() ||
    a.nombreInvitado ||
    "Sin nombre"
  ).toLowerCase();

  const nameB = (
    b.username?.trim() ||
    b.nombreInvitado ||
    "Sin nombre"
  ).toLowerCase();

  return nameA.localeCompare(nameB);
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

        <View style={styles.columnsContainer}>

          {/* LEFT COLUMN — STAFF */}
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Empleados</Text>

            {[...staffOrders].sort(sortByUsername).map((order) => (
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
                  <View style={styles.leftSide}>
                    <Text style={styles.headerText}>
                      Orden #{order.orderNumber} — {order.username ?? "Sin nombre"} —{" "} {getElapsed(order.createdAt)}
                    </Text>

                    {order.items?.map((item, i) => (
                      <Text key={i} style={styles.item}>
                        {item.qty} × {item.ItemName}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.rightSide}>
                    {order.status === "cancelado" && (
                      <Button_style2
                        title="Cancelada"
                        onPress={() => markCancelada(order.id)}
                      />
                    )}

                    {!order.empezada && order.status !== "cancelado" && (
                      <Button_style2
                        title="Empezada"
                        onPress={() => markStarted(order.id)}
                      />
                    )}

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
          </View>

          {/* RIGHT COLUMN — OTHERS */}
          <View style={styles.column}>
            <Text style={styles.columnTitle}>Clientes</Text>

            {[...otherOrders].sort(sortByClientName).map((order) => (
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
                  <View style={styles.leftSide}>
                    <Text style={styles.headerText}>
                      Orden #{order.orderNumber} — 
                      Cliente: {order.username?.trim() || order.nombreInvitado || "Sin nombre"
                    } • Estil: {order.nombreEstilista ?? "No estilista"} —{" "}
                      {getElapsed(order.createdAt)}
                    </Text>

                    {order.items?.map((item, i) => (
                      <Text key={i} style={styles.item}>
                        {item.qty} × {item.ItemName}
                      </Text>
                    ))}
                  </View>

                  <View style={styles.rightSide}>
                    {order.status === "cancelado" && (
                      <Button_style2
                        title="Cancelada"
                        onPress={() => markCancelada(order.id)}
                      />
                    )}

                    {!order.empezada && order.status !== "cancelado" && (
                      <Button_style2
                        title="Empezada"
                        onPress={() => markStarted(order.id)}
                      />
                    )}

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
          </View>

        </View>
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
  columnsContainer: {
  flexDirection: "row",
  gap: 20,
},

column: {
  flex: 1,
},

columnTitle: {
  fontSize: 18,
  fontWeight: "700",
  marginBottom: 10,
  textAlign: "center",
  color: "#333",
},
});
