import Constants from "expo-constants";
import { doc, getDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../services/firestore/firebase";

export const checkAppVersion = async () => {
  try {
    // 1. Allow Expo Go (otherwise it will ALWAYS fail)
    if (Constants.appOwnership === "expo") {
      return true;
    }

    // 2. Load Firestore version requirements
    const versionRef = doc(db, "settings", "appVersion");
    const snap = await getDoc(versionRef);

    // If the document doesn't exist, allow the app
    if (!snap.exists()) return true;

    const data = snap.data();

    const minBuildNumber = Number(data.minBuildNumber ?? 0);
    const minVersionCode = Number(data.minVersionCode ?? 0);

    // 3. Read the current installed build number
    let currentBuild = 0;

    if (Platform.OS === "ios") {
      currentBuild = Number(Constants.expoConfig?.ios?.buildNumber ?? 0);
    } else {
      currentBuild = Number(Constants.expoConfig?.android?.versionCode ?? 0);
    }

    // 4. Compare versions
    const required = Platform.OS === "ios" ? minBuildNumber : minVersionCode;

    // If current build is missing or invalid, treat as outdated
    if (!currentBuild || isNaN(currentBuild)) {
      return false;
    }

    return currentBuild >= required;

  } catch (e) {
    // 5. Fail open — never block the app due to network or Firestore errors
    return true;
  }
};


