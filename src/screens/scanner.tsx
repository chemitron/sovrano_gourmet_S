import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useInvitado } from "../context/InvitadoContext";

export default function ScannerScreen({
  role,
  email,
  username,
}: {
  role?: string;
  email?: string | null;
  username?: string | null;
}) {

  const { setInvitadoEmail } = useInvitado();
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const isExpoGo = Constants.appOwnership === "expo";

  useEffect(() => {
    return () => {
    };
  }, []);

  if (isExpoGo) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>El escáner no funciona en Expo Go.</Text>
        <Text style={styles.subtext}>
          Instala la app desde TestFlight o usa un build de producción.
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

      if (data.includes("inivtado=")) {
        const extracted = data.split("invitado=")[1];
        return extracted;
      }

      if (data.includes("@")) {
        return data;
      }

      return null;
    } catch (err) {
      return null;
    }
  };

  const handleBarcodeScanned = ({ data }: { data: string }) => {

    if (isScanning) {
      return;
    }

    setIsScanning(true);

    const invitado = extractInvitado(data);

    if (invitado) {
      setInvitadoEmail(invitado);

      if (role === "invitado") {
        router.replace("/invitado");
      } else if (role === "usuario") {
        router.replace("/usuario");
      } else {
        router.replace("/invitado");
      }
    } else {
      setIsScanning(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: [
            "qr",
            "pdf417",
            "aztec",
            "datamatrix",
            "code128",
            "ean13",
          ],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      <View style={styles.overlay}>
        <Text style={styles.scanText}>Escanea el código QR del invitado</Text>
      </View>
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
