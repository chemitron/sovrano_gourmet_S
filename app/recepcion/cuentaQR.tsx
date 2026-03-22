import { Stack, useLocalSearchParams } from "expo-router";
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
import { Account, Order } from "../../src/types";

export default function CuentaQRScreen() {
  // ⭐ Receive scanned email
  const { invitado } = useLocalSearchParams();

  const [account, setAccount] = useState<Account | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  // ⭐ Load current user role
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    setCurrentEmail(user.email ?? null);

    const ref = doc(db, "users", user.uid);
    getDoc(ref).then((snap) => {
      if (snap.exists()) {
        setCurrentRole(snap.data().role ?? null);
      }
    });
  }, []);

  // ⭐ Load ONLY the scanned account
  useEffect(() => {
    if (!invitado) return;

    const ref = doc(db, "cuentas_personales", String(invitado));

    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setAccount({
          email: snap.id,
          balance: snap.data().balance ?? 0,
          username: snap.data().username,
        });
      } else {
        setAccount(null);
      }
    });

    return () => unsub();
  }, [invitado]);

  // ⭐ Load ONLY the scanned account’s orders
  useEffect(() => {
    if (!account) return;

    const field =
      account.username?.toLowerCase() === "invitado"
        ? "invitado"
        : "userEmail";

    const q = query(
      collection(db, "orders"),
      where(field, "==", account.email),
      where("chargedToAccount", "==", true),
      where("accountPaid", "==", false),
      where("status", "!=", "cancelado")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];

      setOrders(list);
    });

    return () => unsub();
  }, [account]);

  // ⭐ Mark account as paid
  const markAsPaid = async () => {
    if (!account) return;

    await updateDoc(doc(db, "cuentas_personales", account.email), {
      balance: 0,
    });

    for (const order of orders) {
      await updateDoc(doc(db, "orders", order.id), {
        accountPaid: true,
        paidAt: new Date(),
        paymentStatus: "pagado",
        status: "pagado",
      });
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Cuenta del Invitado",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          {!account && (
            <Text style={styles.emptyText}>
              No existe una cuenta asociada a este código QR.
            </Text>
          )}

          {account && (
            <View style={styles.accountCard}>
              <View style={styles.topRow}>
                <Text style={styles.topItem}>{account.username}</Text>
                <Text style={styles.topItem}>
                  Saldo: ${account.balance.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.sectionTitle}>Órdenes pendientes</Text>

              {orders.length === 0 && (
                <Text style={styles.emptyText}>No hay órdenes pendientes</Text>
              )}

              {orders.map((order) => (
                <View key={order.id} style={{ marginBottom: 12 }}>
                  <View style={styles.rowTop}>
                    <Text style={styles.orderText}>
                      Orden #{order.orderNumber} — ${order.total}
                    </Text>
                  </View>

                  <View style={styles.rowBottom}>
                    <Text style={styles.orderText}>
                      Cargado a cuenta: {order.chargedToAccount ? "Sí" : "No"}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        setSelectedOrder(order);
                        setModalVisible(true);
                      }}
                    >
                      <Text style={styles.detailsLink}>Ver detalles</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {account.balance > 0 && (
                <View style={{ paddingTop: 10 }}>
                  <Button_style2
                    title="Marcar como Pagada"
                    onPress={() => setConfirmVisible(true)}
                    disabled={
                      currentRole === "recepcion" &&
                      account.email === currentEmail
                    }
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </GradientBackground>

      {/* DETAILS MODAL */}
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

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* CONFIRM MODAL */}
      <Modal visible={confirmVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirmación</Text>

            <Text style={styles.modalMessage}>
              ¿Estás seguro que deseas marcar esta cuenta como pagada?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  markAsPaid();
                  setConfirmVisible(false);
                }}
              >
                <Text style={styles.confirmButtonText}>Sí, marcar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
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
  accountCard: {
    width: "90%",
    backgroundColor: "#f5f1e8",
    padding: 15,
    borderRadius: 12,
  },
  emptyText: {
    color: "#777",
    fontStyle: "italic",
  },
  sectionTitle: {
    marginTop: 10,
    fontWeight: "600",
  },
  orderText: {
    fontSize: 15,
  },
  detailsLink: {
    color: "#3A2F2F",
    fontWeight: "600",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  topItem: {
    fontSize: 16,
    fontWeight: "600",
    color: "#3A2F2F",
  },
  rowTop: {
    marginBottom: 2,
  },
  rowBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  modalDate: {
    fontSize: 14,
    color: "#555",
    marginBottom: 10,
    textTransform: "capitalize",
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
  closeButton: {
    backgroundColor: "#3A2F2F",
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  closeButtonText: {
    color: "white",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  modalMessage: {
    fontSize: 16,
    marginBottom: 20,
    color: "#333",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  confirmButton: {
    backgroundColor: "#3A2F2F",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  confirmButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#ddd",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
  },
  cancelButtonText: {
    textAlign: "center",
    fontWeight: "600",
    color: "#333",
  },
});
