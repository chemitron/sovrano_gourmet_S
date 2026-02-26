import { FirebaseOptions, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { Platform } from "react-native";

const firebase: FirebaseOptions =
  Platform.select<FirebaseOptions>({
    ios: {
      apiKey: "AIzaSyAaJBcdzs3hEFWEGIJVrCCezn8jwdE-gms",
      authDomain: "sovrano-cafe.firebaseapp.com",
      projectId: "sovrano-cafe",
      storageBucket: "sovrano-cafe.firebasestorage.app",
      messagingSenderId: "576530471505",
      appId: "1:576530471505:ios:e995d15ccfa80748cd3670",
    },
    android: {
      apiKey: "AIzaSyCREDmlxWbRzKWq0Tnxi45jTMndUyHQZ5w",
      authDomain: "sovrano-cafe.firebaseapp.com",
      projectId: "sovrano-cafe",
      storageBucket: "sovrano-cafe.firebasestorage.app",
      messagingSenderId: "576530471505",
      appId: "1:576530471505:android:697e9ee1f354106fcd3670",
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
