import { router, Stack, useLocalSearchParams } from "expo-router";
import { doc, DocumentData, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button_style2 from "../../../components/Button_style2";
import { auth, db } from "../../../services/firestore/firebase";

export default function CheckoutScreen() {
  const { orderId } = useLocalSearchParams();
  const id = Array.isArray(orderId) ? orderId[0] : orderId;

  const [order, setOrder] = useState<DocumentData | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const user = auth.currentUser;
  const email = user?.email ?? null;

  // ---------------------------
  // LOAD ROLE
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

  const isEmpleado = role === "empleado";
  const isUsuario = role === "usuario" || role === "guest";

  // ---------------------------
  // LOAD ORDER (EXCLUDES CANCELADO)
  // ---------------------------
  useEffect(() => {
    const ref = doc(db, "orders", id);

    const unsubscribe = onSnapshot(ref, (snap) => {
      const data = snap.data();

      // ⭐ Exclude cancelled or missing orders
      if (!data || data.status === "cancelado") {
        setOrder(null);
        return;
      }

      setOrder(data);
    });

    return () => unsubscribe();
  }, [id]);

  // ---------------------------
  // If order is missing or cancelled
  // ---------------------------
  if (!order) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "Pago" }} />
        <View style={styles.container}>
          <Text style={styles.title}>Esta orden ya no está disponible</Text>
          <Text style={styles.total}>La orden fue cancelada o eliminada.</Text>
        </View>
      </>
    );
  }

  // ---------------------------
  // HANDLE CUENTA PERSONAL
  // ---------------------------
  async function handleCuentaPersonal() {
    // EMPLEADO FLOW
    if (isEmpleado) {
      await updateDoc(doc(db, "orders", id), {
        paymentMethod: "cuenta-personal-empleado",
        accountPaid: false,
        userEmail: email,
      });

      router.push({
        pathname: "/empleado/cuenta-personal",
        params: { orderId: id },
      });
      return;
    }

    // USUARIO / INVITADO FLOW
    if (isUsuario) {
      const invitadoId = order!.invitado?.trim().toLowerCase();

      await updateDoc(doc(db, "orders", id), {
        paymentMethod: "cuenta-personal-invitado",
        accountPaid: false,
        invitado: invitadoId,
      });

      router.push({
        pathname: "/usuario/cuenta-personal",
        params: { orderId: id, invitado: invitadoId },
      });
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: "Pago" }} />

      <View style={styles.container}>
        <Text style={styles.title}>Orden #{order.orderNumber}</Text>
        <Text style={styles.total}>Total: ${order.total}</Text>

        <View style={{ paddingBottom: 10 }}>
          <Button_style2
            title="Pagar con cuenta personal"
            onPress={handleCuentaPersonal}
          />
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EFE6",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#3A2F2F",
    textAlign: "center",
    marginTop: 10,
  },
  total: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3A2F2F",
    textAlign: "center",
    marginVertical: 20,
    paddingVertical: 12,
    backgroundColor: "#DDCBAB",
    borderRadius: 12,
  },
});
