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
      console.log("[checkAppVersion] Document missing → allow app");
      console.log("=== [checkAppVersion] END (missing doc) ===");
      return true;
    }

    const data = snap.data();
    console.log("[checkAppVersion] Firestore data:", data);

    const minBuildNumber = Number(data.minBuildNumber ?? 0);
    const minVersionCode = Number(data.minVersionCode ?? 0);
    console.log("[checkAppVersion] minBuildNumber:", minBuildNumber);
    console.log("[checkAppVersion] minVersionCode:", minVersionCode);

    // 3️⃣ Read current installed build number
    let currentBuild = 0;

    if (Platform.OS === "ios") {
      currentBuild = Number(Constants.expoConfig?.ios?.buildNumber ?? 0);
    } else {
      currentBuild = Number(Constants.expoConfig?.android?.versionCode ?? 0);
    }

    console.log("[checkAppVersion] Platform:", Platform.OS);
    console.log("[checkAppVersion] Current build:", currentBuild);

    // 4️⃣ Compare versions
    const required = Platform.OS === "ios" ? minBuildNumber : minVersionCode;
    console.log("[checkAppVersion] Required minimum:", required);

    if (!currentBuild || isNaN(currentBuild)) {
      console.log("[checkAppVersion] Invalid current build → treat as outdated");
      console.log("=== [checkAppVersion] END (invalid build) ===");
      return false;
    }

    const allowed = currentBuild >= required;
    console.log("[checkAppVersion] Comparison result:", allowed);
    console.log("=== [checkAppVersion] END ===");
    return allowed;

  } catch (e) {
    console.log("[checkAppVersion] ERROR:", e);
    console.log("=== [checkAppVersion] END (fail open) ===");
    return true;
  }
};


