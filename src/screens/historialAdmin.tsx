import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { Stack } from "expo-router";
import {
  collection,
  onSnapshot,
  orderBy,
  query
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import GradientBackground from "../../components/GradientBackground";
import { db } from "../../services/firestore/firebase";
import { Order } from "../types";

type HistorialAdminProps = {
  role: string;
};

export default function HistorialAdminScreen({ role }: HistorialAdminProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("__all__");

  // ⭐ Date range state
  const [startDate, setStartDate] = useState<Date>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ⭐ Load ALL orders once
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Order[];

      const filtered = docs.filter((o) => o.status !== "cancelado");

      setOrders(filtered);
    });

    return () => unsub();
  }, []);

  // ⭐ Extract unique usernames
  const usernames = Array.from(
    new Set(
      orders.map((o) => o.username ?? o.userEmail ?? "Invitado")
    )
  );

  // ⭐ Apply filters (username + date range)
  const filteredOrders = orders.filter((o) => {
    const user = o.username ?? o.userEmail ?? "Invitado";
    const created = o.createdAt?.toDate() ?? new Date(0);

    const inUserFilter =
      selectedUser === "__all__" || user === selectedUser;

    const inDateRange =
      created >= startDate && created <= endDate;

    return inUserFilter && inDateRange;
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Historial de Órdenes",
          headerTitleAlign: "center",
        }}
      />

      <GradientBackground>
        <ScrollView contentContainerStyle={styles.container}>

          {/* ⭐ USER FILTER */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Filtrar por usuario:</Text>

            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedUser}
                onValueChange={(v) => setSelectedUser(v)}
                mode={Platform.OS === "android" ? "dropdown" : undefined}
                style={styles.picker}
                itemStyle={Platform.OS === "ios" ? styles.pickerItem : undefined}
              >
                <Picker.Item label="Todos" value="__all__" />
                {usernames.map((u) => (
                  <Picker.Item key={u} label={u} value={u} />
                ))}
              </Picker>
            </View>
          </View>

          {/* ⭐ DATE RANGE FILTER */}
          <View style={styles.filterContainer}>
            <Text style={styles.filterLabel}>Rango de fechas:</Text>

            {/* Start Date */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                Desde:{" "}
                {new Intl.DateTimeFormat("es-CO").format(startDate)}
              </Text>
            </TouchableOpacity>

            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowStartPicker(false);
                  if (date) setStartDate(date);
                }}
              />
            )}

            {/* End Date */}
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                Hasta:{" "}
                {new Intl.DateTimeFormat("es-CO").format(endDate)}
              </Text>
            </TouchableOpacity>

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                onChange={(e, date) => {
                  setShowEndPicker(false);
                  if (date) setEndDate(date);
                }}
              />
            )}
          </View>

          {/* ⭐ ORDERS LIST */}
          {filteredOrders.length === 0 && (
            <Text style={styles.emptyText}>No hay órdenes</Text>
          )}

          {filteredOrders.map((order) => (
            <View key={order.id} style={styles.card}>
              {/* ROW 1 */}
              <View style={styles.row}>
                <View style={styles.colCenter}>
                  <Text style={styles.orderTitle}>Orden #{order.orderNumber}</Text>
                </View>

                <View style={styles.colCenter}>
                  <Text style={styles.orderText}>Estado</Text>
                  <Text style={styles.orderValue}>{order.status}</Text>
                </View>

                <View style={styles.colCenter}>
                  <Text style={styles.orderText}>Total</Text>
                  <Text style={styles.orderValue}>${order.total?.toFixed(2)}</Text>
                </View>
              </View>

              {/* ROW 2 */}
              <View style={styles.rowMeta}>
                <View style={styles.metaGroup}>
                  <Text style={styles.orderText}>Usuario: </Text>
                  <Text style={styles.orderValue}>
                    {order.username ?? order.userEmail ?? "Invitado"}
                  </Text>
                </View>

                <View style={styles.metaGroup}>
                  <Text style={styles.orderText}>Fecha: </Text>
                  <Text style={styles.orderValue}>
                    {order.createdAt
                      ? new Intl.DateTimeFormat("es-CO", {
                          year: "2-digit",
                          month: "numeric",
                          day: "numeric",
                        }).format(order.createdAt.toDate())
                      : "--"}
                  </Text>
                </View>
              </View>

              {/* DETAILS */}
              <View style={styles.itemsContainer}>
                <Text style={styles.itemsTitle}>Detalles de la orden:</Text>

                {order.items?.map((item, index) => (
                  <View key={index} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>• {item.ItemName}</Text>
                      <Text style={styles.itemSub}>
                        Precio: ${item.price?.toFixed(2)}
                      </Text>
                    </View>

                    <Text style={styles.itemQty}>x{item.qty}</Text>

                    <Text style={styles.itemPrice}>
                      ${(item.price * item.qty).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>

            </View>
          ))}
        </ScrollView>
      </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: "center",
    gap: 10,
  },

  /* FILTERS */
  filterContainer: {
    width: "90%",
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 6,
  },

  /* PICKER */
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 8,
    backgroundColor: "white",
  },
  picker: {
    color: "#000",
    backgroundColor: "white",
  },
  pickerItem: {
    color: "#000",
    fontSize: 16,
  },

  /* DATE BUTTONS */
  dateButton: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 8,
  },
  dateButtonText: {
    fontSize: 15,
    color: "#333",
  },

  emptyText: {
    fontSize: 16,
    color: "#555",
    marginTop: 20,
  },

  card: {
    width: "90%",
    backgroundColor: "#f5f1e8",
    borderRadius: 12,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 5,
  },
  colCenter: {
    flex: 1,
    alignItems: "center",
  },

  orderTitle: {
    fontFamily: "Playfair-Bold",
    fontSize: 18,
    color: "#333",
  },
  orderText: {
    fontSize: 15,
    color: "#444",
  },
  orderValue: {
    fontSize: 16,
    color: "#333",
    fontWeight: "600",
    marginTop: 2,
  },

  rowMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginVertical: 4,
  },
  metaGroup: {
    flexDirection: "row",
    alignItems: "center",
  },

  itemsContainer: {
    marginTop: 10,
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#333",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  itemName: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  itemSub: {
    fontSize: 13,
    color: "#666",
  },
  itemQty: {
    fontSize: 15,
    color: "#444",
    width: 40,
    textAlign: "center",
  },
  itemPrice: {
    fontSize: 15,
    color: "#444",
    width: 80,
    textAlign: "right",
  },
});
