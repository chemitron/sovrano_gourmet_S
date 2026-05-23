import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { db } from "../../../services/firestore/firebase";
import { User } from "../../../src/types"; // adjust path if needed

export default function Usuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [filtered, setFiltered] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));

        const list: User[] = snap.docs
          .map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<User, "id">),
          }))
          .sort((a, b) =>
            (a.username || "").toLowerCase().localeCompare((b.username || "").toLowerCase())
          );

        setUsers(list);
        setFiltered(list);
      } catch (e) {
        console.log("Error loading users:", e);
      }
    };

    loadUsers();
  }, []);

  // 🔍 Search filter
  useEffect(() => {
    if (!search.trim()) {
      setFiltered(users);
      return;
    }

    const s = search.toLowerCase();

    const results = users.filter((u) =>
      (u.username || "").toLowerCase().includes(s) ||
      (u.email || "").toLowerCase().includes(s) ||
      (u.phoneNumber || "").toLowerCase().includes(s) ||
      (u.role || "").toLowerCase().includes(s) ||
      (u.platform || "").toLowerCase().includes(s) ||
      (u.id || "").toLowerCase().includes(s)
    );

    setFiltered(results);
  }, [search, users]);

  const renderItem = ({ item }: { item: User }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.username || "Sin nombre"}</Text>

      <Text style={styles.field}>📄 Documento ID: {item.id}</Text>
      <Text style={styles.field}>📧 Email: {item.email || "—"}</Text>
      <Text style={styles.field}>📱 Teléfono: {item.phoneNumber || "—"}</Text>
      <Text style={styles.field}>🎭 Rol: {item.role || "—"}</Text>
      <Text style={styles.field}>📱 Plataforma: {item.platform || "—"}</Text>
      <Text style={styles.field}>🔢 AutoNumber: {item.autoNumber ?? "—"}</Text>
      <Text style={styles.field}>🔔 Push Token: {item.expoPushToken || "—"}</Text>
      <Text style={styles.field}>🟢 Activo: {String(item.activo)}</Text>

      <Text style={styles.field}>
        🕒 Creado: {formatDate(item.createdAt)}
      </Text>

      <Text style={styles.field}>
        🔄 Último login: {formatDate(item.lastLogin)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 🔍 Search Bar */}
      <TextInput
        style={styles.search}
        placeholder="Buscar usuario, email, rol, teléfono, ID..."
        placeholderTextColor="#777"
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", marginTop: 20 }}>
            No se encontraron usuarios
          </Text>
        }
      />
    </View>
  );
}

const formatDate = (value: any) => {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: "#fff",
  },
  search: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  card: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: "#f4f4f4",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  field: {
    fontSize: 14,
    marginBottom: 3,
  },
});
