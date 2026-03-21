import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Button_style2 from "../../../components/Button_style2";
import { auth } from "../../../services/firestore/firebase";

export default function Confirmacion() {
  const { orderId } = useLocalSearchParams();

  // Normalize orderId
  const cleanOrderId =
    Array.isArray(orderId) ? orderId[0] : orderId ?? null;

  const [role, setRole] = useState<string | null>(null);

  // Load role from Firebase Auth
useEffect(() => {
  const user = auth.currentUser;
  if (!user) return;

  user.getIdTokenResult().then((token) => {
    const r = token.claims.role as string | undefined;
    setRole(r ?? "invitado");   // ⭐ FIXED
  });
}, []);

// Compute home route
const homeRoute =
  role === "admin"
    ? "/administrador"
    : role === "usuario"
    ? "/usuario"
    : role === "empleado"
    ? "/empleado"
    : role === "invitado"      // ⭐ FIXED
    ? "/invitado"
    : role === "recepcion"
    ? "/recepcion"
    : role === "contador"
    ? "/contador"
    : role === "chef"
    ? "/chef"
    : "/login";

  const goHome = () => {
    router.replace(homeRoute);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Confirmación",
          headerBackVisible: false,
        }}
      />

      <View style={styles.container}>
        <Text style={styles.title}>Tu orden está siendo preparada</Text>

        {cleanOrderId && (
          <Text style={styles.subtitle}>Orden #{cleanOrderId}</Text>
        )}

        <Text style={styles.subtitle}>¡Gracias!</Text>

        <Button_style2
          title="Volver al menú"
          onPress={goHome}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5EFE6",
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#3A2F2F",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#6B5E5E",
    textAlign: "center",
    marginBottom: 20,
  },
});
