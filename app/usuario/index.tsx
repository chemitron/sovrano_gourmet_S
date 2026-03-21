import Constants from "expo-constants";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
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

// ⭐ Import invitado context fields
import {
  useInvitado,
  useNombreEstilista,
  useNombreInvitado,
  useResetContext,
  useRole,
} from "../../src/context/InvitadoContext";

export default function UsuarioIndex() {
  const username = auth.currentUser?.displayName;
  const email = auth.currentUser?.email ?? null;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : "Buenas tardes";
  const { role, setRole } = useRole();
  const [uid, setUid] = useState<string | null>(null);
  const [isCocinaOpen, setIsCocinaOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("");
  // ⭐ Context setters
  const { setInvitadoEmail } = useInvitado();
  const { setNombreInvitado } = useNombreInvitado();
  const { nombreEstilista, setNombreEstilista } = useNombreEstilista();
  const params = useLocalSearchParams<{ from?: string }>();
  const isExpoGo = Constants.appOwnership === "expo";
  const resetContext = useResetContext();

  // Modal state
  const [showEstilistaModal, setShowEstilistaModal] = useState(false);
  const [nombreEstilistaInput, setNombreEstilistaInput] = useState("");

    // -----------------------------------------------------
  // 👤 3. Load user role
  // -----------------------------------------------------
  useEffect(() => {
    const loadData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const currentUid = currentUser.uid;
      setUid(currentUid);

      const userDoc = await getDoc(doc(db, "users", currentUid));
      const fetchedRole = userDoc.data()?.role;
      setRole(fetchedRole || "usuario");
    };

    loadData();
  }, []);

  // -----------------------------------------------------
  // 🚀 1. Show modal BEFORE scanner (fixed double-open)
  // -----------------------------------------------------
  useEffect(() => {
    if (params.from === "login" && !nombreEstilista) {
      setShowEstilistaModal(true);
      router.setParams({ from: undefined });
    }
  }, [params.from, nombreEstilista]);

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
      resetContext();
      router.dismissAll();
      router.replace("/login");
    } catch (error) {}
  };

  // -----------------------------------------------------
  // 🟦 Handle stylist submission (fixed context timing)
  // -----------------------------------------------------
  const handleEstilistaSubmit = () => {
    if (!nombreEstilistaInput.trim()) return;

    // ⭐ Set all required fields for usuario
    setInvitadoEmail(email); // invitado = email
    setNombreInvitado(username || email?.split("@")[0] || "usuario");
    setNombreEstilista(nombreEstilistaInput.trim());

    setShowEstilistaModal(false);

    // ⭐ Wait for context to update BEFORE navigating
    setTimeout(() => {
      if (!isExpoGo) {
        router.push("/usuario/menu");
      }
    }, 0);
  };

  const isFormValid = nombreEstilistaInput.trim().length > 0;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle: "Usuario",
          headerBackVisible: false,
        }}
      />

      {/* -----------------------------------------------------
          🟦 Estilista Modal
      ----------------------------------------------------- */}
      <Modal visible={showEstilistaModal} transparent animationType="fade">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.modalOverlay}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Nombre de estilista</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Ej: Mario"
                value={nombreEstilistaInput}
                onChangeText={setNombreEstilistaInput}
                autoCapitalize="none"
              />

              <Button_style2
                title="Aceptar"
                onPress={handleEstilistaSubmit}
                disabled={!isFormValid}
              />

              <Button_style2
                title="Cancelar"
                onPress={() => {
                  setShowEstilistaModal(false);
                  router.replace("/login");
                }}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* -----------------------------------------------------
          MAIN UI
      ----------------------------------------------------- */}
      <GradientBackground>
        <Logo />

        <View style={styles.container}>
          <Text style={styles.welcomeText}>
            {`${greeting}, ${username || "usuario"} 👋!`}
          </Text>

          <Text style={styles.welcomeText}>¡Nos alegra verte en Sovrano!</Text>

          <View>
            <Text style={styles.welcomeText}>Responsabilidad: {role}</Text>
          </View>

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

          <View style={{ paddingBottom: 10 }}>
            <Button_style2
              title="Ver menú"
              onPress={() => router.push("/usuario/menu")}
              disabled={!isCocinaOpen}
            />
          </View>

          <View style={{ paddingBottom: 10 }}>
            <Button_style2
              title="Mis ordenes"
              onPress={() => router.push("/usuario/historial")}
            />
          </View>

          <View style={{ paddingBottom: 10 }}>
            <Button_style2
              title="Mi cuenta"
              onPress={() => router.push("/usuario/cuenta-personal")}
            />
          </View>

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
    alignContent: "center",
    padding: 10,
    paddingTop: StatusBar.currentHeight || 0,
  },
  welcomeText: {
    fontFamily: "Playfair-Bold",
    fontSize: 18,
    color: "#3e3e3e",
    textAlign: "center",
    marginBottom: 16,
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
