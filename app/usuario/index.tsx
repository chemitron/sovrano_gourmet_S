import Constants from "expo-constants";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from 'react';
import {
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from '../../components/GradientBackground';
import Logo from '../../components/Logo';
import { auth, db } from '../../services/firestore/firebase';
import { useInvitado } from "../../src/context/InvitadoContext";

export default function UsuarioIndex() {

  const username = auth.currentUser?.displayName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : 'Buenas tardes';

  const [role, setRole] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const [isCocinaOpen, setIsCocinaOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("");

  const { invitadoEmail, setInvitadoEmail } = useInvitado();
  const params = useLocalSearchParams<{ from?: string }>();

  const isExpoGo = Constants.appOwnership === "expo";

  // Modal state for Expo Go
  const [showInvitadoModal, setShowInvitadoModal] = useState(false);
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
      setShowInvitadoModal(true);
    } else {
      router.replace("/usuario/scanner");
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
      setRole(fetchedRole);
    };

    loadData();
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
  // 🟦 Handle invitado submission (Expo Go only)
  // -----------------------------------------------------
  const handleInvitadoSubmit = () => {
    if (!invitadoInput.trim()) return;

    setInvitadoEmail(invitadoInput.trim());
    setShowInvitadoModal(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle:"Usuario",
          headerBackVisible: false,
        }}
      />

      {/* -----------------------------------------------------
          🟦 Expo Go invitado Email Modal
      ----------------------------------------------------- */}
      <Modal visible={showInvitadoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Ingresar estación</Text>

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
              onPress={() => setShowInvitadoModal(false)}
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
            {`${greeting}, ${username || 'usuario'} 👋!`}
          </Text>

          <Text style={styles.welcomeText}>
            ¡Nos alegra verte en Sovrano!
          </Text>

          <View>
            <Text style={styles.welcomeText}>Responsabilidad: {role}</Text>
          </View>

          {!isCocinaOpen && (
            <Text style={{ 
              color: "#b30000", 
              fontSize: 18, 
              textAlign: "center",
              maxWidth: "80%",
              alignSelf: "center" 
            }}>
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

          <Button_style2
            title="Cerrar sesión"
            onPress={handleLogout}
          />
        </View>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignContent: 'center',
    padding: 10,
    paddingTop: StatusBar.currentHeight || 0,
  },
  welcomeText: {
    fontFamily: 'Playfair-Bold',
    fontSize: 18,
    color: '#3e3e3e',
    textAlign: 'center',
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
