import { FirebaseOptions, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebase: FirebaseOptions =
  Platform.select<FirebaseOptions>({
    ios: {
      apiKey: "AIzaSyD-DhdmqXhOeC8hptKiRUJycgHpG3fYzKY",
      authDomain: "sovrano-gourmet-s.firebaseapp.com",
      projectId: "sovrano-gourmet-s",
      storageBucket: "sovrano-gourmet-s.firebasestorage.app",
      messagingSenderId: "602857392422",
      appId: "1:602857392422:ios:a594ff3f1ba9c07a3b59e7",
    },
    android: {
      apiKey: "AIzaSyCtHhPpb6FA4_RWG8f-7fvnGRZDJIl74vo",
      authDomain: "sovrano-gourmet-s.firebaseapp.com",
      projectId: "sovrano-gourmet-s",
      storageBucket: "sovrano-gourmet-s.firebasestorage.app",
      messagingSenderId: "602857392422",
      appId: "1:602857392422:android:fec4e149b14e6f423b59e7",
    },
    default: {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
    },
  })!; // ✅ non-null assertion since Platform.select always returns one branch

const app = initializeApp(firebase);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
