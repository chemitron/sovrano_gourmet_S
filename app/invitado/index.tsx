import Constants from "expo-constants";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import Logo from "../../components/Logo";
import { auth, db } from "../../services/firestore/firebase";
import { useStation } from "../../src/context/StationContext";

export default function InvitadoIndex() {
  const { stationEmail } = useStation();
  const params = useLocalSearchParams<{ from?: string }>();

  const isExpoGo = Constants.appOwnership === "expo";

  const [isCocinaOpen, setIsCocinaOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("");

  // -----------------------------------------------------
  // 🚀 1. Redirect to scanner when needed
  // -----------------------------------------------------
  useEffect(() => {
    if (isExpoGo) return;

    const shouldOpenScanner =
      params.from === "login" || !stationEmail;

    if (shouldOpenScanner) {
      router.replace("/invitado/scanner");
    }
  }, [params.from, stationEmail]);

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

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Invitado", 
          headerBackVisible: false, 
        }} 
      />

      <GradientBackground>
        <View style={styles.container}>
          <Logo />

          {stationEmail && (
            <Text style={{ 
              fontSize: 16, 
              color: "#333", 
              marginBottom: 10 
            }}>
              Estación: {stationEmail}
            </Text>
          )}

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
    backgroundColor: "transparent",
    paddingTop: StatusBar.currentHeight || 50,
    justifyContent: "flex-start",
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "column",
    gap: 16,
  },
});
