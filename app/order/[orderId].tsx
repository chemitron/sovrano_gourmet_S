import { router, Stack, useLocalSearchParams } from "expo-router";
import { doc, getFirestore, onSnapshot, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Button_style2 from "../../components/Button_style2";
import { auth } from "../../services/firestore/firebase";

export default function OrderScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const db = getFirestore();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);

  // ⭐ Load user role
  const [role, setRole] = useState<string | null>(null);

  // ⭐ Comment modal state
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    const loadRole = async () => {
      const token = await auth.currentUser?.getIdTokenResult();
      const roleClaim = token?.claims.role as string | undefined;
      setRole(roleClaim ?? null);
    };
    loadRole();
  }, []);

  // ---------------------------
  // LOAD ORDER (EXCLUDE CANCELADO)
  // ---------------------------
  useEffect(() => {
    if (!orderId) return;

    const ref = doc(db, "orders", orderId);

    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data();

      if (!data || data.status === "cancelado") {
        setOrder(null);
        setLoading(false);
        return;
      }

      setOrder(data);
      setOrderNumber(data.orderNumber ?? null);
      setLoading(false);
    });

    return () => unsub();
  }, [orderId]);

  // ---------------------------
  // COMPUTE TOTAL
  // ---------------------------
  const total = order?.items
    ? order.items.reduce((sum: number, i: any) => sum + i.price * i.qty, 0)
    : 0;

  // ---------------------------
  // SYNC TOTAL TO FIRESTORE
  // ---------------------------
  useEffect(() => {
    if (!orderId || !order?.items) return;

    updateDoc(doc(db, "orders", orderId), {
      total: total,
    });
  }, [order?.items]);

  // ---------------------------
  // UPDATE QTY
  // ---------------------------
  async function increaseQty(index: number) {
    if (!orderId || !order) return;

    const updatedItems = [...order.items];
    updatedItems[index].qty += 1;

    await updateDoc(doc(db, "orders", orderId), {
      items: updatedItems,
    });
  }

  async function decreaseQty(index: number) {
    if (!orderId || !order) return;

    const updatedItems = [...order.items];

    if (updatedItems[index].qty > 1) {
      updatedItems[index].qty -= 1;
    } else {
      updatedItems.splice(index, 1);
    }

    await updateDoc(doc(db, "orders", orderId), {
      items: updatedItems,
    });
  }

  // ---------------------------
  // ⭐ SAVE COMMENT
  // ---------------------------
  async function saveComment() {
    if (selectedIndex === null || !orderId || !order) return;

    const updatedItems = [...order.items];
    updatedItems[selectedIndex].comentario = commentText.trim();

    await updateDoc(doc(db, "orders", orderId), {
      items: updatedItems,
    });

    setCommentModalVisible(false);
    setCommentText("");
    setSelectedIndex(null);
  }

  // ---------------------------
  // HANDLE CUENTA PERSONAL
  // ---------------------------
  async function handleCuentaPersonal() {
  if (!orderId || !order) return;

  // Determine which field to use
  const field = role === "invitado" ? "invitado" : "userEmail";

  // Normalize the value
  const value =
    field === "invitado"
      ? order.invitado?.trim().toLowerCase() ?? null
      : auth.currentUser?.email?.trim().toLowerCase() ?? null;

  // Update Firestore
  await updateDoc(doc(db, "orders", orderId), {
    paymentMethod:
      field === "invitado"
        ? "cuenta-personal-invitado"
        : "cuenta-personal-empleado",
    accountPaid: false,
    [field]: value,
  });

    router.push({
      pathname: "/usuario/cuenta-personal",
      params: { orderId, invitado: value },
    });
}

  // ---------------------------
  // LOADING OR CANCELLED
  // ---------------------------
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!order) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTitle: "Mi Orden",
            headerTitleAlign: "center",
          }}
        />
        <View style={styles.center}>
          <Text style={styles.title}>Esta orden ya no está disponible</Text>
          <Text style={styles.subtitle}>
            La orden fue cancelada o eliminada.
          </Text>
        </View>
      </>
    );
  }

  // ---------------------------
  // MAIN UI
  // ---------------------------
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "Mi Orden",
          headerTitleAlign: "center",
        }}
      />

      {/* ⭐ COMMENT MODAL */}
      <Modal visible={commentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Comentario</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Escribe un comentario..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />

            <Button_style2 title="Guardar" onPress={saveComment} />
            <Button_style2
              title="Cancelar"
              onPress={() => {
                setCommentModalVisible(false);
                setCommentText("");
                setSelectedIndex(null);
              }}
            />
          </View>
        </View>
      </Modal>

      <View style={{ flex: 1, padding: 20 }}>
        <Button_style2
          title="Ordenar"
          onPress={handleCuentaPersonal}
        />
        <Text style={styles.title}>Orden #{orderNumber ?? "..."}</Text>

        <FlatList
          data={order.items}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.itemCard}>
              <View style={styles.row}>
                <Image
                  source={{ uri: item.imageUrl }}
                  style={styles.itemImage}
                />

                <View style={{ flex: 1, marginLeft: 12 }}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.itemName}>{item.ItemName}</Text>
                    <Text style={styles.itemDetails}>${item.price}</Text>
                  </View>

                  <View style={styles.qtyCommentRow}>
                    {/* QTY BUTTONS */}
                    <View style={styles.qtyRow}>
                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => decreaseQty(index)}
                      >
                        <Text style={styles.qtyButtonText}>−</Text>
                      </TouchableOpacity>

                      <Text style={styles.qtyValue}>{item.qty}</Text>

                      <TouchableOpacity
                        style={styles.qtyButton}
                        onPress={() => increaseQty(index)}
                      >
                        <Text style={styles.qtyButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    {/* COMMENT BUTTON */}
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedIndex(index);
                        setCommentText(item.comentario ?? "");
                        setCommentModalVisible(true);
                      }}
                    >
                      <Text style={styles.commentButton}>Comentario</Text>
                    </TouchableOpacity>
                  </View>

                  {/* EXISTING COMMENT */}
                  {item.comentario && (
                    <Text style={styles.commentText}>
                      {item.comentario}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          )}
        />

        <Text style={styles.total}>Total: ${total.toFixed(2)}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#555", textAlign: "center" },

  total: {
    marginTop: 20,
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "right",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#E8DCC5",
  },

  itemCard: {
    backgroundColor: "#DDCBAB",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  itemName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#3A2F2F",
  },

  itemDetails: {
    fontSize: 14,
    color: "#444",
  },

  qtyCommentRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    justifyContent: "space-between",
  },

  qtyRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#CBB89D",
    justifyContent: "center",
    alignItems: "center",
  },

  qtyButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3A2F2F",
  },

  qtyValue: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 12,
  },

  commentButton: {
    marginLeft: 12,
    color: "#2a4d9b",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  commentText: {
    marginTop: 6,
    fontStyle: "italic",
    color: "#333",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },

  modalInput: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    textAlignVertical: "top",
  },
});
