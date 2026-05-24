import { Linking, ScrollView, Text, View } from "react-native";
import Button_style2 from "../../components/Button_style2";

export default function UpdateRequired() {
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          Nueva actualización requerida
        </Text>

        <Text
          style={{
            fontSize: 17,
            textAlign: "center",
            marginBottom: 40,
            lineHeight: 24,
            paddingHorizontal: 10,
          }}
        >
          Por favor actualiza Sovrano Gourmet para continuar usando la aplicación.
        </Text>

        <View style={{ width: "100%", gap: 16 }}>
          <Button_style2
            title="Actualizar ahora para teléfonos Android"
            onPress={() => {
              Linking.openURL(
                "https://play.google.com/apps/internaltest/4700172778985815075"
              );
            }}
          />

          <Button_style2
            title="Actualizar ahora para teléfonos iPhone"
            onPress={() => {
              Linking.openURL("https://apps.apple.com/app/id6759836236");
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
}
