import { Stack, router } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import { auth, db } from "../../services/firestore/firebase";
import { useInvitado } from "../context/InvitadoContext";
import { Order } from "../types";

export default function CuentaPersonalScreen() {
  const { invitadoEmail } = useInvitado();
  const [role, setRole] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmCancelVisible, setConfirmCancelVisible] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  // ---------------------------
  // Load role
  // ---------------------------
  useEffect(() => {
    async function loadRole() {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdTokenResult();
      const roleClaim = token.claims.role as string | undefined;
      setRole(roleClaim ?? null);
    }
    loadRole();
  }, []);

  // ---------------------------
  // Determine correct account email
  // ---------------------------
  const empleadoEmail = auth.currentUser?.email ?? null;

  const email =
  role === "invitado"
    ? invitadoEmail
    : empleadoEmail;

  // ---------------------------
  // Load balance
  // ---------------------------
  useEffect(() => {
    if (!email) return;

    const ref = doc(db, "cuentas_personales", email);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data().balance ?? 0);
      }
    });

    return () => unsub();
  }, [email]);

  // ---------------------------
  // Load unpaid orders
  // ---------------------------
  useEffect(() => {
  if (!email || !role) return;

  // Determine which field to filter by
  const field =
  role === "invitado"
    ? "invitado"
    : "userEmail";

  const q = query(
    collection(db, "orders"),
    where(field, "==", email),
    where("accountPaid", "==", false),
    orderBy("createdAt", "desc")
  );

  const unsub = onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => {
      const data = d.data() as Omit<Order, "id">;
      return { id: d.id, ...data };
    }) as Order[];

    // Extra safety: exclude cancelled
    setOrders(list.filter((o) => o.status !== "cancelado"));
  });

  return () => unsub();
}, [email, role]);

  // ---------------------------
  // Cancel order
  // ---------------------------
  const cancelOrder = async (orderId: string) => {
    if (!email) return;

    const orderRef = doc(db, "orders", orderId);
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return;

    const order = snap.data() as Order;

    await updateDoc(orderRef, {
      status: "cancelado",
      cancelledAt: new Date(),
      cancelledBy: auth.currentUser?.uid ?? null,
    });

    if (order.chargedToAccount) {
      const cuentaRef = doc(db, "cuentas_personales", email);
      await updateDoc(cuentaRef, {
        balance: increment(-(order.total ?? 0)),
      });
    }
  };

  const canCancel = (order: Order) => {
    if (order.status === "cancelado") return false;
    if (order.status === "servida") return false;
    return true;
  };

  // ---------------------------
  // Charge ALL pending orders to account
  // ---------------------------
  const cargarCuenta = async () => {
    if (!email) return;

    const pendingOrders = orders.filter(
      (o) => !o.chargedToAccount && !o.accountPaid && o.status !== "cancelado"
    );

    if (pendingOrders.length === 0) {
      Alert.alert("Sin órdenes", "No hay órdenes pendientes para cargar a la cuenta.");
      return;
    }

    const totalToCharge = pendingOrders.reduce(
      (sum, o) => sum + (o.total ?? 0),
      0
    );

    const cuentaRef = doc(db, "cuentas_personales", email);

    try {
      for (const order of pendingOrders) {
        const orderRef = doc(db, "orders", order.id);

        await updateDoc(orderRef, {
          chargedToAccount: true,
          paymentMethod: "cuenta-personal-invitado",
          paymentStatus: "charged",
          approvalStatus: "aprobado",
          paidAt: serverTimestamp(),
          status: "cargado a cuenta",
          served: false,
        });
      }

      await updateDoc(cuentaRef, {
        balance: increment(totalToCharge),
      });

      const lastOrder = pendingOrders[pendingOrders.length - 1];

      router.push({
        pathname: "/order/[orderId]/confirmacion",
        params: { orderId: lastOrder.id },
      });
    } catch (err) {
      Alert.alert("Error", "No se pudo cargar a la cuenta. Revisa la consola.");
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Cuenta Personal",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.balanceBox}>
            <Text style={styles.balanceLabel}>Saldo actual</Text>
            <Text style={styles.balanceValue}>${balance.toFixed(2)}</Text>
          </View>
          <Button_style2
            title="Cargar a cuenta"
            onPress={cargarCuenta}
          />

          <Text style={styles.sectionTitle}>Órdenes en la cuenta</Text>

          {orders.length === 0 && (
            <Text style={styles.emptyText}>No tienes órdenes pendientes</Text>
          )}

          {orders.map((order) => (
            <View key={order.id} style={styles.orderCard}>
              <View style={styles.grid}>
  <View style={styles.cell}>
    <Text style={styles.orderTitle}>Orden #{order.orderNumber}</Text>
  </View>

  <View style={styles.cell}>
    <Text style={styles.orderAmount}>${order.total?.toFixed(2)}</Text>
  </View>

  <View style={styles.cell}>
    <Text style={styles.orderTitle}>
      Cargada a cuenta {order.chargedToAccount ? "Sí" : "No"}
    </Text>
  </View>

              <View style={styles.cell}>
                <Text style={styles.orderTitle}>
                  Estado: {order.status}
                </Text>
                </View>
              </View>

              <View style={styles.col}>
                                {canCancel(order) ? (
  <Button_style2
    title="Cancelar"
    onPress={() => {
      setOrderToCancel(order);
      setConfirmCancelVisible(true);
    }}
  />
) : (
  <Text style={styles.disabledText}>
    Esta orden no se puede cancelar
  </Text>
)}
                              </View>

              <TouchableOpacity
                onPress={() => {
                  setSelectedOrder(order);
                  setModalVisible(true);
                }}
              >
                <Text style={styles.detailsLink}>Ver detalles</Text>
              </TouchableOpacity>
            </View>
            
          ))}

        </ScrollView>
      </GradientBackground>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              Orden #{selectedOrder?.orderNumber}
            </Text>

            {selectedOrder?.createdAt && (
              <Text style={styles.modalDate}>
                {new Intl.DateTimeFormat("es-CO", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(selectedOrder.createdAt.toDate())}
              </Text>
            )}

            {selectedOrder?.items?.map((item, i) => (
              <View key={i} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.ItemName}</Text>
                <Text style={styles.itemPrice}>
                  ${item.price} x {item.qty}
                </Text>
              </View>
            ))}

            <Text style={styles.modalTotal}>
              Total: ${selectedOrder?.total}
            </Text>

            <Button_style2
              title="Cerrar"
              onPress={() => {
                setModalVisible(false);
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={confirmCancelVisible} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Confirmación</Text>

      <Text style={styles.modalDate}>
        ¿Deseas cancelar la orden #{orderToCancel?.orderNumber}?
      </Text>

      <View style={{ marginTop: 20, gap: 10 }}>
        <Button_style2
          title="Sí, cancelar"
          onPress={async () => {
            if (orderToCancel) {
              await cancelOrder(orderToCancel.id);
            }
            setConfirmCancelVisible(false);
            setOrderToCancel(null);
          }}
        />

        <Button_style2
          title="No, volver"
          onPress={() => {
            setConfirmCancelVisible(false);
            setOrderToCancel(null);
          }}
        />
      </View>
    </View>
  </View>
</Modal>

    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: "center",
    gap: 20,
  },
  balanceBox: {
    backgroundColor: "#DDCBAB",
    padding: 20,
    borderRadius: 12,
    width: "90%",
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 18,
    color: "#3A2F2F",
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3A2F2F",
    marginTop: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#3A2F2F",
    width: "90%",
  },
  emptyText: {
    color: "#666",
    fontStyle: "italic",
  },
  orderCard: {
    backgroundColor: "#fff",
    width: "90%",
    padding: 15,
    borderRadius: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3A2F2F",
  },
  detailsLink: {
    marginTop: 10,
    color: "#3A2F2F",
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    width: "85%",
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  itemName: {
    fontSize: 16,
  },
  itemPrice: {
    fontSize: 16,
  },
  modalTotal: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "right",
  },
  modalDate: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
  },
  grid: {
  flexDirection: "row",
  flexWrap: "wrap",
  width: "100%",
  marginTop: 10,
},
col: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
cell: {
  width: "50%",       // ⭐ two columns
  paddingVertical: 6,
},
disabledText: {
    marginTop: 10,
    color: "#777",
    fontStyle: "italic",
  },
});
