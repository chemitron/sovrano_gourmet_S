import { Stack } from "expo-router";
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

export default function AdminCuentasScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [orders, setOrders] = useState<Record<string, Order[]>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [selectedOrderList, setSelectedOrderList] = useState<Order[]>([]);
  const [pendingOrdersModal, setPendingOrdersModal] = useState(false);

  const [filter, setFilter] = useState<
  "sinPagarEmpleado"
  >("sinPagarEmpleado");

  // ⭐ NEW — current user role + email
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

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

  // ⭐ Load accounts
  useEffect(() => {
    const ref = collection(db, "cuentas_personales");

    const unsub = onSnapshot(ref, (snap) => {
      const list = snap.docs
        .map((d) => ({
          email: d.id,
          balance: d.data().balance ?? 0,
          username: d.data().username,
        }))
        .filter((acc) => acc.balance > 0);

      setAccounts(list);
    });

    return () => unsub();
  }, []);

  // ⭐ Load orders for each account
  useEffect(() => {
  const unsubscribes: (() => void)[] = [];

  accounts.forEach((acc) => {
    const field =
      acc.username?.toLowerCase() === "invitado"
        ? "invitado"
        : "userEmail";

    const q = query(
      collection(db, "orders"),
      where(field, "==", acc.email),
      where("chargedToAccount", "==", true),
      where("accountPaid", "==", false),
      where("status", "!=", "cancelado")
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];

      setOrders((prev) => ({
        ...prev,
        [acc.email]: list,
      }));
    });

    unsubscribes.push(unsub);
    global.addUnsubscribe?.(unsub); // ⭐ register globally
  });

  return () => {
    unsubscribes.forEach((fn) => fn());
  };
}, [accounts]);

  // ⭐ Mark account as paid
  const markAsPaid = async (email: string) => {
    const relatedOrders = orders[email] ?? [];

    await updateDoc(doc(db, "cuentas_personales", email), {
      balance: 0,
    });

    for (const order of relatedOrders) {
      await updateDoc(doc(db, "orders", order.id), {
        accountPaid: true,
        paidAt: new Date(),
        paymentStatus: "pagado",
        status: "pagado",
      });
    }
  };

  // ⭐ Filtering logic
  const filteredAccounts = accounts.filter((acc) => {

    const accountOrders = orders[acc.email] ?? [];
    const role = accountOrders[0]?.role?.toLowerCase() ?? null;

    const isEmpleadoRole =
      role === "empleado" ||
      role === "admin" ||
      role === "chef" ||
      role === "recepcion" ||
      role === "contador";

    const isUsuarioRole =
      role === "usuario" || role === "invitado";

    if (filter === "sinPagarEmpleado") {
      return isEmpleadoRole && acc.balance > 0;
    }

    return true;
  });

  const getAccountRole = (accountOrders: Order[]) => {
  const role = accountOrders[0]?.role?.toLowerCase() ?? null;

  if (!role) return "Sin rol";

  // Capitalize first letter
  return role.charAt(0).toUpperCase() + role.slice(1);
};

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Cuentas de Empleados",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          {/* FILTERS */}
          <View style={styles.filterRow}>

            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "sinPagarEmpleado" && styles.filterButtonActive,
              ]}
              onPress={() => setFilter("sinPagarEmpleado")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "sinPagarEmpleado" &&
                    styles.filterButtonTextActive,
                ]}
              >
                Sin pagar empleado
              </Text>
            </TouchableOpacity>
          </View>

          {/* ACCOUNT CARDS */}
          {filteredAccounts.map((acc) => {
            const accountOrders = orders[acc.email] ?? [];

            return (
              <View key={acc.email} style={styles.accountCard}>
                <View style={styles.topRow}>
  <View>
    <Text style={styles.topItem}>{acc.username}</Text>

    <Text style={styles.roleItem}>
      Posicion: {getAccountRole(accountOrders)}
    </Text>
  </View>

  <Text style={styles.topItem}>
    Saldo: $
    {acc.balance.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}
  </Text>
</View>

                <Button_style2
  title="Ver órdenes pendientes"
  onPress={() => {
    setSelectedOrderList(accountOrders);
    setPendingOrdersModal(true);
  }}
/>

                {/* ⭐ Disable button if contador is viewing their own account */}
                {acc.balance > 0 && (
                  <View style={{ paddingTop: 10 }}>
                    <Button_style2
                      title="Marcar como Pagada"
                      onPress={() => {
                        setPendingEmail(acc.email);
                        setConfirmVisible(true);
                      }}
                      disabled={
                        currentRole === "contador" &&
                        acc.email === currentEmail
                      }
                    />
                  </View>
                )}
              </View>
            );
          })}
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
                  if (pendingEmail) {
                    markAsPaid(pendingEmail);
                  }
                  setConfirmVisible(false);
                  setPendingEmail(null);
                }}
              >
                <Text style={styles.confirmButtonText}>Sí, marcar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setConfirmVisible(false);
                  setPendingEmail(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={pendingOrdersModal} transparent animationType="fade">
  <View style={styles.modalOverlay}>
    <View style={styles.modalBox}>
      <Text style={styles.modalTitle}>Órdenes pendientes</Text>

      {selectedOrderList.length === 0 && (
        <Text style={styles.emptyText}>No hay órdenes pendientes</Text>
      )}

      {selectedOrderList.map((order) => (
        <View key={order.id} style={{ marginBottom: 12 }}>
          <Text style={styles.orderText}>
            Orden #{order.orderNumber} — ${order.total}
          </Text>
        </View>
      ))}

      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => setPendingOrdersModal(false)}
      >
        <Text style={styles.closeButtonText}>Cerrar</Text>
      </TouchableOpacity>
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
  orderText: {
    fontSize: 15,
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
  filterRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginBottom: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#ddd",
  },
  filterButtonActive: {
    backgroundColor: "#3A2F2F",
  },
  filterButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "white",
  },
  roleItem: {
  fontSize: 14,
  fontWeight: "500",
  color: "#5a4f4f",
  marginTop: 2,
},
});
