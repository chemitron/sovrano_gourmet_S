import { getAuth, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "../../services/firestore/firebase";
import { useNombreEstilista } from "../../src/context/InvitadoContext";
import MenuScreen from "../../src/screens/MenuScreen";

export default function UsuarioMenu() {
  const [email, setEmail] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  const { nombreEstilista } = useNombreEstilista();   // ⭐ read from context

  useEffect(() => {
    const auth = getAuth();

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEmail(null);
        setUsername(null);
        return;
      }

      setEmail(user.email ?? null);

      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data();
        setUsername(data.username ?? null);
      }
    });

    return unsub;
  }, []);

  return (
    <MenuScreen
      role="usuario"
      email={email}
      username={username}
    />
  );
}

