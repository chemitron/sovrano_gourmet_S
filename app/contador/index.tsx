import Constants from "expo-constants";
import { router, Stack } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import { auth, db } from "../../services/firestore/firebase";
import { useResetContext } from "../../src/context/InvitadoContext";

export default function ContadorIndex() {
  const windowDimensions = useWindowDimensions();
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;
  const username = auth.currentUser?.displayName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : "Buenas tardes";

  const [role, setRole] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const isExpoGo = Constants.appOwnership === "expo";
  const resetContext = useResetContext();

  // Modal for Expo Go manual QR input
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrInput, setQrInput] = useState("invitado_1@sovranogourmet.com");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      resetContext();
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

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle: "Contador",
          headerBackVisible: false,
        }}
      />

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
              {`${greeting}, ${username || "contador"} 👋`}
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
              onPress={() => router.push("/contador/cuentas")}
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
