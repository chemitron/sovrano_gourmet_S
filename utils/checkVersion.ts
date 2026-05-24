import Constants from "expo-constants";
import { doc, getDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../services/firestore/firebase";

export const checkAppVersion = async () => {

  try {
    // 1️⃣ Allow Expo Go
    if (Constants.appOwnership === "expo") {
      return true;
    }

    // 2️⃣ Load Firestore version requirements
    const versionRef = doc(db, "settings", "appVersion");

    const snap = await getDoc(versionRef);

    if (!snap.exists()) {
      return true;
    }

    const data = snap.data();

    // 🔥 NEW FIELD NAMES
    const requiredBuildNumber = Number(data.buildNumber ?? 0);   // iOS
    const requiredVersionCode = Number(data.versionCode ?? 0);   // Android

    // 3️⃣ Read current installed build number
    let currentBuild = 0;

    if (Platform.OS === "ios") {
      currentBuild = Number(Constants.expoConfig?.ios?.buildNumber ?? 0);
    } else {
      currentBuild = Number(Constants.expoConfig?.android?.versionCode ?? 0);
    }

    // 4️⃣ Strict comparison (must match EXACTLY)
    const required = Platform.OS === "ios" ? requiredBuildNumber : requiredVersionCode;

    if (!currentBuild || isNaN(currentBuild)) {
      return false;
    }

    const allowed = currentBuild === required;
    return allowed;

  } catch (e) {
    // 🔥 FIRESTORE FALLBACK
    return true;
  }
};
