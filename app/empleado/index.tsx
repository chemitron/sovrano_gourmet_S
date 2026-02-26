import { router, Stack } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Button_style2 from "../../components/Button_style2";
import GradientBackground from '../../components/GradientBackground';
import Logo from '../../components/Logo';
import { auth, db } from '../../services/firestore/firebase';

export default function EmpleadoIndex() {
  const windowDimensions = useWindowDimensions();
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;
  const [uid, setUid] = useState<string | null>(null);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : 'Buenas tardes';
  const username = auth.currentUser?.displayName;
  const [isCocinaOpen, setIsCocinaOpen] = useState(true);
const [closedMessage, setClosedMessage] = useState("");
const [role, setRole] = useState<string | null>(null);

const handleLogout = async () => {
    try {
      await signOut(auth);

      router.dismissAll();
      router.replace("/login");
    } catch (error) {
      //console.log("Logout error:", error);
    }
  };

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
        headerTitle:"Empleado",
        headerBackVisible: false,
      }}
    />
    <GradientBackground>
      <Logo />
      <View style={styles.container}>
        <View
          style={{
            width: windowWidth > 500 ? '70%' : '90%',
            height: windowHeight > 600 ? '60%' : '90%',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <View>
            <Text style={styles.welcomeText}>{`${greeting}, ${username || 'invitado'} 👋`}</Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>¡Nos alegra verte en Sovrano!</Text>
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
         <View style={{ paddingBottom: 5 }}>
          <Button_style2
            title="Ver menú"
            onPress={() => router.push("/empleado/menu")}
            disabled={!isCocinaOpen}
          />
</View> 
<View style={{ paddingBottom: 5 }}>
          <Button_style2
                        title="Mis ordenes"
                        onPress={() => router.push("/empleado/historial")}
                      />
                      </View>

          <View style={{ paddingBottom: 5 }}>
          <Button_style2
                        title="Mi cuenta"
                        onPress={() => router.push("/empleado/cuenta-personal")}
                      />
                      </View>

          <View style={{ paddingBottom: 5 }}>
          <Button_style2
                      title="Cerrar sesión"
                      onPress={handleLogout}
                    />
  </View>
          {(role === "admin" ) && (
  <View style={{ paddingBottom: 10 }}>
    <Button_style2
      title="Administrador"
      onPress={() => router.push("/administrador")}
    />
  </View>
)}

{(role === "recepcion") && (
  <View style={{ paddingBottom: 10 }}>
    <Button_style2
      title="Recepcion"
      onPress={() => router.push("/recepcion")}
    />
  </View>
)}
        </View>
      </View>
    </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  welcomeText: {
    fontFamily: 'Playfair-Bold',
    fontSize: 18,
    color: '#3e3e3e',
    textAlign: 'center',
    marginBottom: 16,
  },
});
