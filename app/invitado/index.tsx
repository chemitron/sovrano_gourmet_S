import Constants from "expo-constants";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import Logo from "../../components/Logo";
import { auth, db } from "../../services/firestore/firebase";
import { useInvitado } from "../../src/context/InvitadoContext";

export default function InvitadoIndex() {
  const { invitadoEmail, setInvitadoEmail } = useInvitado();
  const params = useLocalSearchParams<{ from?: string }>();

  const isExpoGo = Constants.appOwnership === "expo";

  const [isCocinaOpen, setIsCocinaOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("");

  // Modal state for Expo Go
  const [showInvitadoIdModal, setShowInvitadoIdModal] = useState(false);

  // Pre-filled full email
  const [invitadoInput, setInvitadoInput] = useState(
    "invitado_1@sovranogourmet.com"
  );

  // -----------------------------------------------------
  // 🚀 1. Redirect to scanner OR open modal in Expo Go
  // -----------------------------------------------------
  useEffect(() => {
    const shouldOpen = params.from === "login" || !invitadoEmail;

    if (!shouldOpen) return;

    if (isExpoGo) {
      setShowInvitadoIdModal(true);
    } else {
      router.replace("/invitado/scanner");
    }
  }, [params.from, invitadoEmail]);

  // -----------------------------------------------------
  // 🔥 2. Cocina open/closed listener
  // -----------------------------------------------------
  useEffect(() => {
    const ref = doc(db, "counters", "cocina");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setIsCocinaOpen(snap.data().isOpen);
        setClosedMessage(snap.data().message);
      }
    });
    return () => unsub();
  }, []);

  // -----------------------------------------------------
  // 🔐 Logout
  // -----------------------------------------------------
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.dismissAll();
      router.replace("/login");
    } catch (error) {}
  };

  // -----------------------------------------------------
  // 🟦 Handle invitado submission
  // -----------------------------------------------------
  const handleInvitadoSubmit = () => {
    if (!invitadoInput.trim()) return;

    setInvitadoEmail(invitadoInput.trim());
    setShowInvitadoIdModal(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Invitado",
          headerBackVisible: false,
        }}
      />

      {/* -----------------------------------------------------
          🟦 Expo Go invitado Email Modal
      ----------------------------------------------------- */}
      <Modal visible={showInvitadoIdModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ingresar invitado Id</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="invitado_1@sovranogourmet.com"
              value={invitadoInput}
              onChangeText={setInvitadoInput}
              autoCapitalize="none"
            />

            <Button_style2 title="Aceptar" onPress={handleInvitadoSubmit} />
            <Button_style2
              title="Cancelar"
              onPress={() => setShowInvitadoIdModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* -----------------------------------------------------
          MAIN UI
      ----------------------------------------------------- */}
      <GradientBackground>
        <View style={styles.container}>
          <Logo />

          {invitadoEmail && (
            <Text
              style={{
                fontSize: 16,
                color: "#333",
                marginBottom: 10,
              }}
            >
              Invitado: {invitadoEmail}
            </Text>
          )}

          {!isCocinaOpen && (
            <Text
              style={{
                color: "#b30000",
                fontSize: 18,
                textAlign: "center",
                maxWidth: "80%",
                alignSelf: "center",
              }}
            >
              {closedMessage}
            </Text>
          )}

          <Button_style2
            title="Ver menú"
            onPress={() => router.push("/invitado/menu")}
            disabled={!isCocinaOpen}
          />

          <View style={{ paddingBottom: 10 }}>
            <Button_style2
              title="Mi cuenta"
              onPress={() => router.push("/invitado/cuenta-personal")}
            />
          </View>

          <Button_style2
            title="Registrarse"
            onPress={() => router.push("/invitado/registrarse")}
          />

          <Button_style2 title="Cerrar sesión" onPress={handleLogout} />
        </View>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
    paddingTop: StatusBar.currentHeight || 50,
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "column",
    gap: 16,
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
