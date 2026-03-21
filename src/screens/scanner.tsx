import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useInvitado,
  useNombreEstilista,
  useNombreInvitado,
  useRole,
} from "../context/InvitadoContext";

export default function ScannerScreen() {
  const { setInvitadoEmail } = useInvitado();
  const { setNombreInvitado } = useNombreInvitado();
  const { setNombreEstilista } = useNombreEstilista();
  const { role, setRole } = useRole();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempInvitado, setTempInvitado] = useState("");
  const [nombreInvitado, setNombreInvitadoLocal] = useState("");
  const [nombreEstilista, setNombreEstilistaLocal] = useState("");
  const isExpoGo = Constants.appOwnership === "expo";

  // Expo Go cannot use scanner → redirect to InvitadoIndex modal
  if (isExpoGo) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>El escáner no funciona en Expo Go.</Text>
        <Text style={styles.subtext}>
          Usa TestFlight o un build de producción.
        </Text>
      </View>
    );
  }

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>Necesitas otorgar permiso a la cámara.</Text>
      </View>
    );
  }

  const extractInvitado = (data: string): string | null => {
    try {
      if (data.startsWith("{")) {
        const parsed = JSON.parse(data);
        return parsed.invitadoEmail || parsed.invitado || null;
      }

      if (data.includes("invitado=")) {
        return data.split("invitado=")[1];
      }

      if (data.includes("@")) {
        return data;
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {
  if (isScanning) return;

  setIsScanning(true);

  const invitado = extractInvitado(data);

  if (invitado) {
    const cleaned = invitado.trim().toLowerCase();
    setTempInvitado(cleaned);

    if (role === "invitado") {
      // ⭐ Invitado → pedir datos
      setModalVisible(true);
    } else {
      // ⭐ Usuario → NO abrir modal
      setInvitadoEmail(cleaned);
      setNombreInvitado("usuario");
      setNombreEstilista("usuario");

      router.replace("/usuario/scanner");
    }
  } else {
    setIsScanning(false);
  }
};

  const handleConfirm = () => {
    setRole("invitado");
    setInvitadoEmail(tempInvitado);
    setNombreInvitado(nombreInvitado);
    setNombreEstilista(nombreEstilista);

    setModalVisible(false);

    router.replace({
      pathname: "/invitado",
      params: { from: "scanner" },
    });
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417", "aztec", "datamatrix", "code128", "ean13"],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.scanText}>Escanea el código QR</Text>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Datos del Invitado</Text>

            <TextInput
              placeholder="Nombre del invitado"
              style={styles.input}
              value={nombreInvitado}
              onChangeText={setNombreInvitadoLocal}
              placeholderTextColor="#000"
            />

            <TextInput
              placeholder="Nombre del estilista"
              style={styles.input}
              value={nombreEstilista}
              onChangeText={setNombreEstilistaLocal}
              placeholderTextColor="#000"
            />

            <TouchableOpacity style={styles.button} onPress={handleConfirm}>
              <Text style={styles.buttonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  camera: { flex: 1 },
  overlay: {
    position: "absolute",
    bottom: 60,
    width: "100%",
    alignItems: "center",
  },
  scanText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#000",
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  warning: {
    fontSize: 18,
    color: "#b30000",
    textAlign: "center",
    marginBottom: 10,
  },
  subtext: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
  },
});
