import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import { auth, db } from "../../services/firestore/firebase";

export default function RecepcionCuentas() {
  const { invitado } = useLocalSearchParams<{ invitado: string }>();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);

  // -----------------------------------------------------
  // 👤 Load user role
  // -----------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const currentUid = currentUser.uid;
      setUid(currentUid);

      const userDoc = await getDoc(doc(db, "users", currentUid));
      const fetchedRole = userDoc.data()?.role;
      setRole(fetchedRole);
    };

    loadData();
  }, []);

  // -----------------------------------------------------
  // 💰 Load balance from cuentas_personales
  // -----------------------------------------------------
  useEffect(() => {
    if (!invitado || !role) return;

    // guest → invitado
    // usuario, empleado, admin, chef, recepcion → userEmail
    const field =
      role === "guest"
        ? "invitado"
        : "userEmail";

    // The document ID in cuentas_personales is always the email
    const accountEmail = invitado;

    const ref = doc(db, "cuentas_personales", accountEmail);

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setBalance(snap.data().balance ?? 0);
      } else {
        setBalance(0);
      }
    });

    return () => unsub();
  }, [invitado, role]);

  // -----------------------------------------------------
  // 🔥 Load unpaid orders for this invitado/userEmail
  // -----------------------------------------------------
  useEffect(() => {
    if (!invitado || !role) return;

    const field =
      role === "guest"
        ? "invitado"
        : "userEmail";

    const q = query(
      collection(db, "orders"),
      where(field, "==", invitado),
      where("accountPaid", "==", false),
      where("status", "!=", "cancelado")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      setOrders(list);
      setLoading(false);
    });

    return () => unsub();
  }, [invitado, role]);

  // -----------------------------------------------------
  // 🟦 Mark all orders as paid
  // -----------------------------------------------------
  const markAllAsPaid = async () => {
    try {
      for (const order of orders) {
        const ref = doc(db, "orders", order.id);
        await updateDoc(ref, {
          accountPaid: true,
          paidAt: new Date(),
          paymentStatus: "pagado",
          status: "pagado",
        });
      }

      // Reset balance in Firestore
      await updateDoc(doc(db, "cuentas_personales", invitado), {
        balance: 0,
      });

      setConfirmVisible(false);
      router.back();
    } catch (err) {}
  };

  if (loading) {
    return (
      <GradientBackground>
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      </GradientBackground>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Cuenta por QR",
          headerTitleAlign: "center",
        }}
      />

      {/* -----------------------------------------------------
          CONFIRMATION MODAL
      ----------------------------------------------------- */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirmar pago</Text>
            <Text style={styles.modalMessage}>
              ¿Deseas marcar esta cuenta como pagada?
            </Text>

            <Button_style2 title="Sí, marcar pagada" onPress={markAllAsPaid} />
            <Button_style2
              title="Cancelar"
              onPress={() => setConfirmVisible(false)}
            />
          </View>
        </View>
      </Modal>

      {/* -----------------------------------------------------
          MAIN UI
      ----------------------------------------------------- */}
      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.header}>
            Invitado: {invitado}
          </Text>

          <Text style={styles.balanceText}>
            Balance actual: ${balance.toFixed(2)}
          </Text>

          {orders.length === 0 && (
            <Text style={styles.empty}>No hay órdenes pendientes</Text>
          )}

          {orders.map((order) => (
            <View key={order.id} style={styles.card}>
              <Text style={styles.orderHeader}>
                Orden #{order.orderNumber}
              </Text>

              {order.items?.map((item: any, i: number) => (
                <Text key={i} style={styles.item}>
                  {item.qty} × {item.ItemName} — ${item.price.toFixed(2)}
                </Text>
              ))}
            </View>
          ))}

          {orders.length > 0 && (
            <Button_style2
              title="Marcar cuenta como pagada"
              onPress={() => setConfirmVisible(true)}
            />
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    color: "#333",
  },
  balanceText: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    color: "#3e3e3e",
  },
  empty: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  card: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  orderHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
  },
  item: {
    fontSize: 16,
    color: "#444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
  },
});
