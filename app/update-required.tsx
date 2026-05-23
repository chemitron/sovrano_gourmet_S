import { Linking, Text, View } from "react-native";
import Button_style2 from "../components/Button_style2";

export default function UpdateRequired() {
  return (
    <View style={{ flex: 1, justifyContent: "center", padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: "bold", textAlign: "center" }}>
        Nueva actualización requerida
      </Text>

      <Text style={{ marginTop: 20, fontSize: 16, textAlign: "center" }}>
        Por favor actualiza Sovrano Gourmet para continuar usando la aplicación.
      </Text>

      <Button_style2
        title="Actualizar ahora para telefonos android"
        onPress={() => {
          Linking.openURL("https://play.google.com/apps/internaltest/4700172778985815075");
        }}
      />

      <Button_style2
  title="Actualizar ahora para telefonos iPhone"
  onPress={() => {
    Linking.openURL("https://apps.apple.com/app/id6759836236");
  }}
/>

    </View>
  );
}
