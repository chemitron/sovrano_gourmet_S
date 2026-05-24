import Constants from "expo-constants";
import { doc, getDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../services/firestore/firebase";

export const checkAppVersion = async () => {
  console.log("=== [checkAppVersion] START ===");
  console.log("App ownership:", Constants.appOwnership);
  console.log("Expo config:", Constants.expoConfig);

  try {
    // 1️⃣ Allow Expo Go
    if (Constants.appOwnership === "expo") {
      console.log("[checkAppVersion] Running in Expo Go → bypass version check");
      console.log("=== [checkAppVersion] END (Expo Go bypass) ===");
      return true;
    }

    // 2️⃣ Load Firestore version requirements
    const versionRef = doc(db, "settings", "appVersion");
    console.log("[checkAppVersion] Fetching Firestore document:", versionRef.path);

    const snap = await getDoc(versionRef);
    console.log("[checkAppVersion] Document exists:", snap.exists());

    if (!snap.exists()) {
      console.log("[checkAppVersion] Document missing → fallback allow");
      console.log("=== [checkAppVersion] END (missing doc) ===");
      return true;
    }

    const data = snap.data();
    console.log("[checkAppVersion] Firestore data:", data);

    // 🔥 NEW FIELD NAMES
    const requiredBuildNumber = Number(data.buildNumber ?? 0);   // iOS
    const requiredVersionCode = Number(data.versionCode ?? 0);   // Android

    console.log("[checkAppVersion] required buildNumber (iOS):", requiredBuildNumber);
    console.log("[checkAppVersion] required versionCode (Android):", requiredVersionCode);

    // 3️⃣ Read current installed build number
    let currentBuild = 0;

    if (Platform.OS === "ios") {
      currentBuild = Number(Constants.expoConfig?.ios?.buildNumber ?? 0);
    } else {
      currentBuild = Number(Constants.expoConfig?.android?.versionCode ?? 0);
    }

    console.log("[checkAppVersion] Platform:", Platform.OS);
    console.log("[checkAppVersion] Current build:", currentBuild);

    // 4️⃣ Strict comparison (must match EXACTLY)
    const required = Platform.OS === "ios" ? requiredBuildNumber : requiredVersionCode;
    console.log("[checkAppVersion] Required EXACT version:", required);

    if (!currentBuild || isNaN(currentBuild)) {
      console.log("[checkAppVersion] Invalid current build → block app");
      console.log("=== [checkAppVersion] END (invalid build) ===");
      return false;
    }

    const allowed = currentBuild === required;
    console.log("[checkAppVersion] Comparison result (strict match):", allowed);
    console.log("=== [checkAppVersion] END ===");
    return allowed;

  } catch (e) {
    // 🔥 FIRESTORE FALLBACK
    console.log("[checkAppVersion] ERROR (Firestore unreachable):", e);
    console.log("[checkAppVersion] Fallback → allow app to open");
    console.log("=== [checkAppVersion] END (fail open) ===");
    return true;
  }
};
