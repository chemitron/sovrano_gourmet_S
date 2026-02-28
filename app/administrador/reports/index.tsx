import { router, Stack } from "expo-router";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from "../../../components/GradientBackground";

export default function ReportsIndex() {
  const windowDimensions = useWindowDimensions();
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;

  return (
    <>
      <Stack.Screen
        options={{
          headerTitleAlign: "center",
          headerTitle: "Reportes",
          headerBackVisible: true, 
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
            <Button_style2
              title="Lista de compras"
              onPress={() => router.push("/administrador/reports/comprasNecesarias")}
            />

            <Button_style2
              title="Inventario"
              onPress={() => router.push("/administrador/reports/inventario")}
            />

            <Button_style2
              title="Historial de ordenes"
              onPress={() => router.push("/administrador/reports/historial")}
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
    marginTop: 20,
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
