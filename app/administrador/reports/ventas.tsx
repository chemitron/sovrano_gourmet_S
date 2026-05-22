import { Stack } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useState } from "react";
import { Button, ScrollView, Text, TextInput, View } from "react-native";
import { db } from "../../../services/firestore/firebase";

export default function ReportsVentas() {
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFinal, setFechaFinal] = useState("");

  const [valorEmpleado, setValorEmpleado] = useState<number | null>(null);
  const [valorCliente, setValorCliente] = useState<number | null>(null);
  const [valorCombinado, setValorCombinado] = useState<number | null>(null);

  const parseDate = (str: string) => {
    // Expecting YYYY-MM-DD
    const parts = str.split("-");
    if (parts.length !== 3) return null;
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 0, 0, 0);
  };

  const generarReporte = async () => {
    const start = parseDate(fechaInicio);
    const end = parseDate(fechaFinal);

    if (!start || !end) {
      alert("Fechas inválidas. Usa formato YYYY-MM-DD.");
      return;
    }

    // Extend end date to include the full day
    end.setHours(23, 59, 59, 999);

    // --- Helper to sum ventas ---
    const sumarVentas = async (path: string) => {
      const ref = collection(db, path);
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

    // --- Fetch totals ---
    const totalEmpleado = await sumarVentas("ventas/empleado");
    const totalCliente = await sumarVentas("ventas/cliente");

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

      <ScrollView style={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
          Reporte de Ventas por Fecha
        </Text>

        {/* Fecha Inicio */}
        <Text style={{ fontSize: 16, marginBottom: 6 }}>Fecha inicio (YYYY-MM-DD)</Text>
        <TextInput
          value={fechaInicio}
          onChangeText={setFechaInicio}
          placeholder="2024-01-01"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 8,
            marginBottom: 15,
          }}
        />

        {/* Fecha Final */}
        <Text style={{ fontSize: 16, marginBottom: 6 }}>Fecha final (YYYY-MM-DD)</Text>
        <TextInput
          value={fechaFinal}
          onChangeText={setFechaFinal}
          placeholder="2024-01-31"
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            padding: 10,
            borderRadius: 8,
            marginBottom: 20,
          }}
        />

        <Button title="Generar Reporte" onPress={generarReporte} />

        {/* Results */}
        {valorEmpleado !== null && (
          <View style={{ marginTop: 30 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>Resultados</Text>

            <Text style={{ fontSize: 16, marginTop: 10 }}>
              Valor empleado: <Text style={{ fontWeight: "bold" }}>${valorEmpleado}</Text>
            </Text>

            <Text style={{ fontSize: 16, marginTop: 10 }}>
              Valor cliente: <Text style={{ fontWeight: "bold" }}>${valorCliente}</Text>
            </Text>

            <Text style={{ fontSize: 16, marginTop: 10 }}>
              Valor combinado: <Text style={{ fontWeight: "bold" }}>${valorCombinado}</Text>
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}
