import { router, Stack } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import { auth, db } from "../../services/firestore/firebase";

export default function RecepcionIndex() {
  const windowDimensions = useWindowDimensions();
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;
  const username = auth.currentUser?.displayName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : "Buenas tardes";
  const [role, setRole] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  const handleLogout = async () => {
      try {
        await signOut(auth);
  
        router.dismissAll();
        router.replace("/login");
      } catch (error) {
        //console.log("Logout error:", error);
      }
    };

  // Load admin role + cocina state
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
          headerTitle: "Administrador",
          headerBackVisible: false, 
        }}
      />

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
            <View>
              <Text style={styles.welcomeText}>
                {`${greeting}, ${username || "invitado"} 👋`}
              </Text>
            </View>

            <View>
              <Text style={styles.welcomeText}>¡Nos alegra verte en Sovrano!</Text>
            </View>
            
            <Button_style2
              title="Ingresar como empleado"
              onPress={() => router.push("/empleado")}
            />
            
            <Button_style2
              title="Cuentas con balances"
              onPress={() => router.push("/administrador/cuentas")}
            />
            
            <Button_style2
                        title="Cerrar sesión"
                        onPress={handleLogout}
                      />
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
    paddingTop:10,
  },
});
