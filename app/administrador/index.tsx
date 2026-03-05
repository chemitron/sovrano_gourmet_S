import { router, Stack } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Button_style2 from "../../components/Button_style2";
import GradientBackground from "../../components/GradientBackground";
import { auth, db } from "../../services/firestore/firebase";

export default function AdminIndex() {
  const windowDimensions = useWindowDimensions();
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;

  const username = auth.currentUser?.displayName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : "Buenas tardes";

  const [role, setRole] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

  // Cocina state
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const [closedMessage, setClosedMessage] = useState<string>("");

useEffect(() => {
  setRole("admin");
}, []);


  const handleLogout = async () => {
      try {
        await signOut(auth);
  
        router.dismissAll();
        router.replace("/login");
      } catch (error) {
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

      if (fetchedRole !== "admin") {
        Alert.alert("Usuario no es administrador");
      }

      // Load cocina state
      const cocinaRef = doc(db, "counters", "cocina");
      const cocinaSnap = await getDoc(cocinaRef);

      if (cocinaSnap.exists()) {
        setIsOpen(cocinaSnap.data().isOpen);
        setClosedMessage(cocinaSnap.data().message);
      }
    };

    loadData();
  }, []);

  // Toggle cocina open/closed
  const toggleCocina = async () => {
    const cocinaRef = doc(db, "counters", "cocina");
    const newState = !isOpen;

    await updateDoc(cocinaRef, {
      isOpen: newState,
      message: "Lo sentimos. Sovrano Gourmet está cerrado hoy."
    });

    setIsOpen(newState);
  };

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

            {/* Admin navigation buttons */}
            <Button_style2
              title="Manejo empleados"
              onPress={() => router.push("/administrador/manejo_empleados")}
            />
            <Button_style2
              title="Manejo responsabilidades"
              onPress={() => router.push("/administrador/manejo_responsabilidad")}
            />
            <Button_style2
              title="Manejo menu categorias"
              onPress={() => router.push("/administrador/manejo_menu_categorias")}
            />
            <Button_style2
              title="Manejo platos del menu"
              onPress={() => router.push("/administrador/manejo_menu_items")}
            />
            <Button_style2
              title="Manejo ingredientes"
              onPress={() => router.push("/administrador/ingredientes")}
            />
            <Button_style2
              title="Ingresar como empleado"
              onPress={() => router.push("/empleado")}
            />
            <Button_style2
              title="Cuentas con balances"
              onPress={() => router.push("/administrador/cuentas")}
            />
            <Button_style2
              title="Reportes"
              onPress={() => router.push("/administrador/reports")}
            />

            {/* Cocina toggle */}
            <Button_style2
              title={isOpen ? "Cerrar cocina" : "Abrir cocina"}
              onPress={toggleCocina}
            />

            {/* Show closed message when cocina is closed */}
            {!isOpen && (
              <Text style={[styles.welcomeText, { color: "#b30000" }]}>
                {closedMessage}
              </Text>
            )}
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
