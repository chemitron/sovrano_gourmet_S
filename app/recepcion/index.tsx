import Constants from "expo-constants";
import { router, Stack } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import { auth, db } from "../../services/firestore/firebase";

export default function RecepcionIndex() {
  const windowDimensions = useWindowDimensions();
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;

  const username = auth.currentUser?.displayName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : "Buenas tardes";

  const [role, setRole] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const isExpoGo = Constants.appOwnership === "expo";

  // Modal for Expo Go manual QR input
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrInput, setQrInput] = useState("invitado_1@sovranogourmet.com");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.dismissAll();
      router.replace("/login");
    } catch (error) {}
  };

  // Load role
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

  // Handle QR submission (Expo Go)
  const handleQrSubmit = () => {
    if (!qrInput.trim()) return;

    setShowQrModal(false);

    router.push({
      pathname: "/recepcion/cuentas",
      params: { invitado: qrInput.trim() },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle: "Recepción",
          headerBackVisible: false,
        }}
      />

      {/* -----------------------------------------------------
          🟦 Expo Go QR Manual Modal
      ----------------------------------------------------- */}
      <Modal visible={showQrModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.modalOverlay}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Código QR (email invitado)</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="invitado_1@sovranogourmet.com"
                value={qrInput}
                onChangeText={setQrInput}
                autoCapitalize="none"
              />

              <Button_style2
                title="Aceptar"
                onPress={handleQrSubmit}
                disabled={qrInput.trim().length === 0}
              />

              <Button_style2
                title="Cancelar"
                onPress={() => setShowQrModal(false)}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* -----------------------------------------------------
          MAIN UI
      ----------------------------------------------------- */}
      <GradientBackground>
        <View style={styles.container}>
          <View
            style={{
              width: windowWidth > 500 ? "70%" : "90%",
              height: windowHeight > 600 ? "60%" : "90%",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <Text style={styles.welcomeText}>
              {`${greeting}, ${username || "recepción"} 👋`}
            </Text>

            <Text style={styles.welcomeText}>
              ¡Nos alegra verte en Sovrano!
            </Text>

            <Button_style2
              title="Ingresar como empleado"
              onPress={() => router.push("/empleado")}
            />

            <Button_style2
              title="Cuentas con balances"
              onPress={() => router.push("/administrador/cuentas")}
            />

            <Button_style2
              title="Balance para Código QR"
              onPress={() => {
                if (isExpoGo) {
                  setShowQrModal(true);
                } else {
                  router.push("/recepcion/scanner");
                }
              }}
            />

            <Button_style2 title="Cerrar sesión" onPress={handleLogout} />
          </View>
        </View>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  welcomeText: {
    fontFamily: "Playfair-Bold",
    fontSize: 18,
    color: "#3e3e3e",
    textAlign: "center",
    marginBottom: 5,
    paddingTop: 10,
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
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
});
