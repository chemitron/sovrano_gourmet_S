import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import { useState } from "react";
import { Modal, Text, TextInput, View } from "react-native";
import Button_style2 from "../../components/Button_style2";

// -----------------------------
// ⭐ Strongly typed props
// -----------------------------
interface InvitadoSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onInvitadoSelected: (email: string) => void;
  defaultValue?: string;
}

export default function InvitadoSelectorModal({
  visible,
  onClose,
  onInvitadoSelected,
  defaultValue = "",
}: InvitadoSelectorModalProps) {
  const isExpoGo = Constants.appOwnership === "expo";
  const [invitadoValue, setInvitadoValue] = useState(defaultValue);
  const [permission, requestPermission] = useCameraPermissions();

  const handleSelect = (value: string) => {
    onInvitadoSelected(value);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <View
          style={{
            backgroundColor: "white",
            padding: 20,
            borderRadius: 12,
            width: "90%",
          }}
        >
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Estación asignada
          </Text>

          {/* Manual input */}
          <TextInput
            value={invitadoValue}
            onChangeText={setInvitadoValue}
            autoCapitalize="none"
            placeholder="Ingresa estación manualmente"
            style={{
              borderWidth: 1,
              borderColor: "#ccc",
              padding: 10,
              borderRadius: 8,
              marginBottom: 20,
            }}
          />

          {/* QR Scanner (not in Expo Go) */}
          {!isExpoGo && (
            <View style={{ height: 250, marginBottom: 20 }}>
              {!permission?.granted ? (
                <Button_style2
                  title="Permitir cámara"
                  onPress={requestPermission}
                />
              ) : (
                <CameraView
                  style={{ flex: 1, borderRadius: 12, overflow: "hidden" }}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={(result) => {
                    const scanned = result.data;
                    handleSelect(scanned);
                  }}
                />
              )}
            </View>
          )}

          {/* Continue button */}
          <Button_style2
            title="Continuar"
            onPress={() => handleSelect(invitadoValue)}
          />
        </View>
      </View>
    </Modal>
  );
}
