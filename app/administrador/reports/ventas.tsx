import DateTimePicker from "@react-native-community/datetimepicker";
import { Stack } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Button_style2 from "../../../components/Button_style2";
import GradientBackground from "../../../components/GradientBackground";
import { db } from "../../../services/firestore/firebase";

export default function ReportsVentas() {
  const insets = useSafeAreaInsets();

  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFinal, setFechaFinal] = useState(new Date());

  const [showPicker, setShowPicker] = useState<null | "inicio" | "final">(null);

  const [valorEmpleado, setValorEmpleado] = useState<number | null>(null);
  const [valorCliente, setValorCliente] = useState<number | null>(null);
  const [valorCombinado, setValorCombinado] = useState<number | null>(null);

  const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

  const generarReporte = async () => {
    const start = new Date(`${formatLocalDate(fechaInicio)}T00:00:00`);
    const end = new Date(`${formatLocalDate(fechaFinal)}T23:59:59`);

    const sumarVentas = async (tipo: "empleado" | "cliente") => {
      const ref = collection(db, `ventas/${tipo}/registros`);

      const qVentas = query(
        ref,
        where("fecha", ">=", start),
        where("fecha", "<=", end)
      );

      const snap = await getDocs(qVentas);
      let total = 0;

      snap.forEach((doc) => {
        const data = doc.data();
        total += data.valor ?? 0;
      });

      return total;
    };

    const totalEmpleado = await sumarVentas("empleado");
    const totalCliente = await sumarVentas("cliente");

    setValorEmpleado(totalEmpleado);
    setValorCliente(totalCliente);
    setValorCombinado(totalEmpleado + totalCliente);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Reporte de Ventas",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Reporte de Ventas por Fecha</Text>

          {/* FECHA INICIO */}
          <Text style={styles.label}>Fecha inicio</Text>
          <View style={styles.pickerWrapper}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker("inicio")}
            >
              <Text style={styles.dateButtonText}>
                {formatLocalDate(fechaInicio)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* FECHA FINAL */}
          <Text style={styles.label}>Fecha final</Text>
          <View style={styles.pickerWrapper}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowPicker("final")}
            >
              <Text style={styles.dateButtonText}>
                {formatLocalDate(fechaFinal)}
              </Text>
            </TouchableOpacity>
          </View>

          <Button_style2 title="Generar Reporte" onPress={generarReporte} />

          {/* RESULTADOS */}
          {valorEmpleado !== null && (
            <View style={{ marginTop: 30 }}>
              <Text style={styles.resultTitle}>Resultados</Text>

              <Text style={styles.resultText}>
                Valor empleado:{" "}
                <Text style={styles.bold}>${valorEmpleado}</Text>
              </Text>

              <Text style={styles.resultText}>
                Valor cliente:{" "}
                <Text style={styles.bold}>${valorCliente}</Text>
              </Text>

              <Text style={styles.resultText}>
                Valor combinado:{" "}
                <Text style={styles.bold}>${valorCombinado}</Text>
              </Text>
            </View>
          )}
        </ScrollView>
      </GradientBackground>

      {/* BOTTOM-SHEET DATE PICKER */}
      <Modal
        visible={showPicker !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPicker(null)}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity
            style={styles.bottomSheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowPicker(null)}
          />

          <View
            style={[
              styles.bottomSheetContainer,
              { paddingBottom: insets.bottom || 16 },
            ]}
          >
            <View style={styles.bottomSheetHeader}>
              <TouchableOpacity onPress={() => setShowPicker(null)}>
                <Text style={styles.bottomSheetHeaderText}>Cancelar</Text>
              </TouchableOpacity>

              <Text style={styles.bottomSheetHeaderTitle}>
                Seleccionar fecha
              </Text>

              <TouchableOpacity onPress={() => setShowPicker(null)}>
                <Text style={styles.bottomSheetHeaderText}>OK</Text>
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={showPicker === "inicio" ? fechaInicio : fechaFinal}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              textColor="#000" 
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  if (showPicker === "inicio") setFechaInicio(selectedDate);
                  if (showPicker === "final") setFechaFinal(selectedDate);
                }
                if (Platform.OS !== "ios") setShowPicker(null);
              }}
              style={styles.bottomSheetPicker}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20 },
  title: { fontSize: 20, fontWeight: "bold" },
  label: { fontSize: 16, fontWeight: "600" },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#00796b",
    borderRadius: 8,
    backgroundColor: "white",
  },
  dateButton: {
    backgroundColor: "#fff",
    borderColor: "#00796b",
    borderWidth: 1,
    height: 50,
    justifyContent: "center",
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  dateButtonText: { fontSize: 16, color: "#000" },
  resultTitle: { fontSize: 18, fontWeight: "bold" },
  resultText: { fontSize: 16, marginTop: 10 },
  bold: { fontWeight: "bold" },

  // Bottom sheet
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheetContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 10,
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  bottomSheetHeaderText: {
    fontSize: 16,
    color: "#00796b",
    fontWeight: "600",
  },
  bottomSheetHeaderTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  bottomSheetPicker: {
    backgroundColor: "#fff",
  },
});
