import { Stack } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import GradientBackground from "../../components/GradientBackground";
import { auth, db } from "../../services/firestore/firebase";
import { useInvitado } from "../context/InvitadoContext";
import { Order } from "../types";

export default function HistorialScreen({ role }: { role: string }) {
  const { invitadoEmail } = useInvitado();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    const email = auth.currentUser?.email;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let q;

    if (uid || email) {
      q = query(
        collection(db, "orders"),
        where("userUid", "==", uid ?? "__none__"),
        where("createdAt", ">=", thirtyDaysAgo),
        orderBy("createdAt", "desc")
      );
    } else if (invitadoEmail) {
      q = query(
        collection(db, "orders"),
        where("invitado", "==", invitadoEmail),
        where("createdAt", ">=", thirtyDaysAgo),
        orderBy("createdAt", "desc")
      );
    } else {
      return;
    }

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];

      const filtered = docs.filter((o) => o.status !== "cancelado");

      setOrders(filtered);
    });

    return () => unsub();
  }, [invitadoEmail]);

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Órdenes",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <View>
            <Text style={styles.orderText}>Últimos 30 días</Text>
          </View>

          {orders.length === 0 && (
            <Text style={styles.emptyText}>No tienes órdenes</Text>
          )}

          {orders.map((order) => (
            <View key={order.id} style={styles.card}>

              {/* ⭐ ROW 1 — Orden, Estado, Total */}
              <View style={styles.row}>
                <View style={styles.colCenter}>
                  <Text style={styles.orderTitle}>Orden #{order.orderNumber}</Text>
                </View>

                <View style={styles.colCenter}>
                  <Text style={styles.orderText}>Estado</Text>
                  <Text style={styles.orderValue}>{order.status}</Text>
                </View>

                <View style={styles.colCenter}>
                  <Text style={styles.orderText}>Total</Text>
                  <Text style={styles.orderValue}>${order.total?.toFixed(2)}</Text>
                </View>
              </View>

              {/* ⭐ ROW 2 — Artículos (left) + Fecha (right) */}
<View style={styles.rowMeta}>
                <View style={styles.metaGroup}>
                  <Text style={styles.orderText}>Artículos: </Text>
                  <Text style={styles.orderValue}>
                    {order.items?.length ?? 0}
                  </Text>
                </View>

                <View style={styles.metaGroup}>
                  <Text style={styles.orderText}>Fecha: </Text>
                  <Text style={styles.orderValue}>
                    {order.createdAt
                      ? new Intl.DateTimeFormat("es-CO", {
                          year: "2-digit",
                          month: "numeric",
                          day: "numeric",
                        }).format(order.createdAt.toDate())
                      : "--"}
                  </Text>
                </View>
              </View>

              {/* ⭐ ORDER DETAILS */}
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>Detalles de la orden:</Text>

                {order.items?.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>• {item.ItemName}</Text>
                      <Text style={styles.itemSub}>
                        Precio: ${item.price?.toFixed(2)}
                      </Text>
                    </View>

                    <Text style={styles.itemQty}>x{item.qty}</Text>

                    <Text style={styles.itemPrice}>
                      ${(item.price * item.qty).toFixed(2)}
                    </Text>
                  </View>
                ))}
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
    padding: 10,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: "#555",
    marginTop: 20,
  },
  card: {
    width: "90%",
    backgroundColor: "#f5f1e8",
    padding: 0,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  /* ROW 1 */
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 5,
  },
  colCenter: {
    flex: 1,
    alignItems: "center",
  },

  row2: {
  flexDirection: "row",
  justifyContent: "space-between",
  width: "100%",
  paddingHorizontal: 10,
  marginTop: 5,
  marginBottom: 5,
},

leftBlock: {
  flexDirection: "column",
  alignItems: "flex-start",
},

rightBlock: {
  flexDirection: "column",
  alignItems: "flex-end",
},

  orderTitle: {
    fontFamily: "Playfair-Bold",
    fontSize: 18,
    color: "#333",
  },
  orderText: {
    fontSize: 15,
    color: "#444",
  },
  orderValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginTop: 2,
  },

  itemsContainer: {
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  itemName: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  itemSub: {
    fontSize: 13,
    color: "#666",
  },
  itemQty: {
    fontSize: 15,
    color: "#444",
    width: 40,
    textAlign: "center",
  },
  itemPrice: {
    fontSize: 15,
    color: "#444",
    width: 80,
    textAlign: "right",
  },
  rowMeta: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    width: "100%", 
    paddingHorizontal: 10, 
    marginTop: 4, 
    marginBottom: 4, }, 
  metaGroup: { 
    flexDirection: "row", 
    alignItems: "center", },
});
