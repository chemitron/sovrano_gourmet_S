import { sendEmailVerification } from 'firebase/auth';
import { Alert, StyleSheet, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import Button_style2 from "../../components/Button_style2";
import { auth } from '../../services/firestore/firebase';
import { logError } from "../../utils/logger";

export default function Reenviar_correoIndex() {
  const windowDimensions = useWindowDimensions();
  const windowWidth = windowDimensions.width;
  const windowHeight = windowDimensions.height;

  const handleResendVerification = async (): Promise<void> => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        Alert.alert(
          'Correo enviado',
          'Revisa tu bandeja de entrada y tu folder de spam (Correo no deseado).'
        );
      } else {
        Alert.alert('Error', 'No hay usuario autenticado.');
      }
    } catch (error) {
      logError("Verification error:", error);
      Alert.alert('Error', 'No se pudo enviar el correo de verificación.');
    }
  };
  
  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <View style={{
          width: windowWidth > 500 ? "70%" : "90%",
          height: windowHeight > 600 ? "60%" : "90%"
        }}>
          <Button_style2
            title="Re-enviar verificacion de correo electronico"
            onPress={handleResendVerification}
            gradientColors={['#00c6ff', '#0072ff']}
            textColor="#fff"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
});
