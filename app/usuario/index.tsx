import { router, Stack, useLocalSearchParams } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from '../../components/GradientBackground';
import Logo from '../../components/Logo';
import { auth, db } from '../../services/firestore/firebase';
import { useStation } from "../../src/context/StationContext";
import StationSelectorModal from "../../src/screens/StationSelectorModal";

export default function UsuarioIndex() {

  const username = auth.currentUser?.displayName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : 'Buenas tardes';
  const [role, setRole] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stylists, setStylists] = useState<{ id: string; name: string; profilePic?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCocinaOpen, setIsCocinaOpen] = useState(true);
  const [closedMessage, setClosedMessage] = useState("");
  const { setStationEmail } = useStation(); 
  const [stationValue, setStationValue] = useState( "estacion_1@sovranogourmet.com");
  const params = useLocalSearchParams<{ from?: string }>();

  const handleLogout = async () => {
      try {
        await signOut(auth);
  
        router.dismissAll();
        router.replace("/login");
      } catch (error) {
      }
    };

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

useEffect(() => {
    const loadData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const currentUid = currentUser.uid;
      setUid(currentUid);

      // Check role
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
        headerTitle:"Usuario",
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
    maxWidth: "80%", // ⭐ forces wrapping 
    alignSelf: "center" }}>
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  stylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  stylistImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  stylistText: {
    fontSize: 16,
  },
  placeholderPic: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
