import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

export default function RecepcionScanner() {
  const [permission, requestPermission] = useCameraPermissions();
  const [isScanning, setIsScanning] = useState(false);
  const isExpoGo = Constants.appOwnership === "expo";

  if (isExpoGo) {
    return (
      <View style={styles.center}>
        <Text style={styles.warning}>El escáner no funciona en Expo Go.</Text>
        <Text style={styles.subtext}>
          Ingresa el código manualmente desde la pantalla anterior.
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
      router.replace({
        pathname: "/recepcion/cuentaqr",
        params: { invitado },
      });
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
          barcodeTypes: ["qr"],
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
