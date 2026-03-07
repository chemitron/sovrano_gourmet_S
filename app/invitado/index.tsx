import Constants from "expo-constants";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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

import {
  useInvitado,
  useNombreEstilista,
  useNombreInvitado,
  useResetContext,
  useRole,
} from "../../src/context/InvitadoContext";

export default function InvitadoIndex() {
  const { invitadoEmail, setInvitadoEmail } = useInvitado();
  const { nombreInvitado, setNombreInvitado } = useNombreInvitado();
  const { nombreEstilista, setNombreEstilista } = useNombreEstilista();
  const { role, setRole } = useRole();

  const params = useLocalSearchParams<{ from?: string }>();
  const isExpoGo = Constants.appOwnership === "expo";

  const [isCocinaOpen, setIsCocinaOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("");

  const [showInvitadoModal, setShowInvitadoModal] = useState(false);
  const [invitadoInput, setInvitadoInput] = useState("invitado_1@sovranogourmet.com");
  const [nombreInvitadoInput, setNombreInvitadoInput] = useState("");
  const [nombreEstilistaInput, setNombreEstilistaInput] = useState("");

  const resetContext = useResetContext();

  // ⭐ Handle navigation logic for Expo Go vs Production
  useEffect(() => {
    // If coming from scanner → values already set → do NOT open modal
    if (params.from === "scanner") {
      router.setParams({ from: undefined });
      return;
    }

    // Coming from login and no invitadoEmail yet
    if (params.from === "login" && !invitadoEmail) {
      if (isExpoGo) {
        // Expo Go → modal
        setShowInvitadoModal(true);
      } else {
        // Production → scanner
        router.replace("/invitado/scanner");
      }
    }

    router.setParams({ from: undefined });
  }, [params.from, invitadoEmail]);

  // ⭐ Listen to cocina open/close state
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      resetContext();
      router.dismissAll();
      router.replace("/login");
    } catch (error) {}
  };

  const handleInvitadoSubmit = () => {
    if (!isFormValid) return;

    setRole("invitado");
    setInvitadoEmail(invitadoInput.trim());
    setNombreInvitado(nombreInvitadoInput.trim());
    setNombreEstilista(nombreEstilistaInput.trim());

    setShowInvitadoModal(false);
  };

  const isFormValid =
    invitadoInput.trim().length > 0 &&
    nombreInvitadoInput.trim().length > 0 &&
    nombreEstilistaInput.trim().length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: "Invitado",
          headerBackVisible: false,
        }}
      />

      {/* ⭐ Expo Go modal */}
      <Modal visible={showInvitadoModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.modalOverlay}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Invitado Id</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="invitado_1@sovranogourmet.com"
                value={invitadoInput}
                onChangeText={setInvitadoInput}
                autoCapitalize="none"
              />

              <Text style={styles.modalTitle}>Nombre de invitado</Text>
              <TextInput
                style={styles.modalInput}
                value={nombreInvitadoInput}
                onChangeText={setNombreInvitadoInput}
              />

              <Text style={styles.modalTitle}>Nombre de estilista</Text>
              <TextInput
                style={styles.modalInput}
                value={nombreEstilistaInput}
                onChangeText={setNombreEstilistaInput}
                autoCapitalize="none"
              />

              <Button_style2
                title="Aceptar"
                onPress={handleInvitadoSubmit}
                disabled={!isFormValid}
              />

              <Button_style2
                title="Cancelar"
                onPress={() => {
                  setShowInvitadoModal(false);
                  router.replace("/login");
                }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ⭐ Main UI */}
      <GradientBackground>
        <View style={styles.container}>
          <Logo />

          {invitadoEmail && (
            <Text style={{ fontSize: 16, color: "#333", marginBottom: 10 }}>
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
              onPress={() => router.push("/usuario/cuenta-personal")}
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
