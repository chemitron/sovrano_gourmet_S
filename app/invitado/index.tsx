import { useCameraPermissions } from "expo-camera";
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
import StationSelectorModal from "../../src/screens/StationSelectorModal";

export default function InvitadoIndex() {
  const { stationEmail } = useStation();
  const [modalVisible, setModalVisible] = useState(false);
  const { setStationEmail } = useStation();  
  const [stationValue, setStationValue] = useState( "estacion_1@sovranogourmet.com");
  const params = useLocalSearchParams<{ from?: string }>();
  const isExpoGo = Constants.appOwnership === "expo";
  const [permission, requestPermission] = useCameraPermissions();

  const handleLogout = async () => {
    try {
      await signOut(auth);

      router.dismissAll();
      router.replace("/login");
    } catch (error) {
    }
  };
  
  const [isCocinaOpen, setIsCocinaOpen] = useState(true);
const [closedMessage, setClosedMessage] = useState("");

useEffect(() => {
  if (params.from === "login") {
    setModalVisible(true);
  }
}, [params.from]);

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

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: "Invitado", 
          headerBackVisible: false, 
        }} 
      />

      <StationSelectorModal
  visible={modalVisible}
  defaultValue={stationValue}
  onClose={() => setModalVisible(false)}
  onStationSelected={(email) => {
    setStationEmail(email);
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
    maxWidth: "80%", // ⭐ forces wrapping 
    alignSelf: "center" }}>
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
