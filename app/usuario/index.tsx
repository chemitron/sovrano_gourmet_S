import Constants from "expo-constants";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Alert,
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

  // Modals
  const [showEstilistaModal, setShowEstilistaModal] = useState(false);
  const [nombreEstilistaInput, setNombreEstilistaInput] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletedModal, setShowDeletedModal] = useState(false);

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
  // 🗑️ Delete Account (Firebase Auth + Firestore + cuentas_personales)
  // -----------------------------------------------------
  const handleDeleteAccount = async (password: string) => {
  try {
    const user = auth.currentUser;
    if (!user || !user.email) return;

    // Close password modal
    setShowPasswordModal(false);

    // 1. Reauthenticate
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);

    // 2. Delete Firestore user document
    await deleteDoc(doc(db, "users", user.uid));

    // 3. Delete cuenta_personal document
    await deleteDoc(doc(db, "cuentas_personales", user.email));

    // 4. Delete Firebase Auth user
    await deleteUser(user);

    // 5. Show confirmation modal
    setShowDeletedModal(true);
    setDeletePassword("");

  } catch (error: any) {
    console.log("🔥 DELETE ERROR:", error); // <-- IMPORTANT

    if (error.code === "auth/wrong-password") {
      Alert.alert("Error", "La contraseña es incorrecta.");
      return;
    }

    if (error.code === "auth/requires-recent-login") {
      Alert.alert(
        "Reautenticación requerida",
        "Por seguridad, vuelve a iniciar sesión para eliminar tu cuenta."
      );
      return;
    }

    // NEW: Show real Firebase error
    Alert.alert("Error", `No se pudo eliminar la cuenta.\n\n${error.code}`);
  }
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
          🔐 Password Confirmation Modal
      ----------------------------------------------------- */}
      <Modal visible={showPasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Confirmar contraseña</Text>

            <TextInput
              style={styles.modalInput}
              secureTextEntry
              placeholder="Ingresa tu contraseña"
              value={deletePassword}
              onChangeText={setDeletePassword}
            />

            <Button_style2
              title="Eliminar cuenta"
              onPress={() => handleDeleteAccount(deletePassword)}
              disabled={!deletePassword.trim()}
            />

            <Button_style2
              title="Cancelar"
              onPress={() => {
                setShowPasswordModal(false);
                setDeletePassword("");
              }}
            />
          </View>
        </View>
      </Modal>

      {/* -----------------------------------------------------
          🟩 Account Deleted Confirmation Modal
      ----------------------------------------------------- */}
      <Modal visible={showDeletedModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Cuenta eliminada</Text>

            <Text style={{ textAlign: "center", fontSize: 16 }}>
              Tu cuenta ha sido eliminada exitosamente.
            </Text>

            <Button_style2
              title="Aceptar"
              onPress={() => {
                setShowDeletedModal(false);
                resetContext();
                router.dismissAll();
                router.replace("/login");
              }}
            />
          </View>
        </View>
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

          <View style={{ paddingBottom: 10 }}>
            <Button_style2 title="Cerrar sesión" onPress={handleLogout} />
          </View>

          <View style={{ paddingBottom: 10 }}>
            <Button_style2
              title="Eliminar cuenta"
              onPress={() => setShowPasswordModal(true)}
            />
          </View>
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
