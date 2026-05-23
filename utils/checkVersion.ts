import Constants from "expo-constants";
import { doc, getDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../services/firestore/firebase";

export const checkAppVersion = async () => {
  try {
    const versionRef = doc(db, "settings", "appVersion");
    const snap = await getDoc(versionRef);

    if (!snap.exists()) return true;

    const data = snap.data();

    const minBuildNumber = data.minBuildNumber ?? 0;
    const minVersionCode = data.minVersionCode ?? 0;

    let currentBuild = 0;

    if (Platform.OS === "ios") {
      currentBuild = Number(Constants.expoConfig?.ios?.buildNumber ?? 0);
    } else {
      currentBuild = Number(Constants.expoConfig?.android?.versionCode ?? 0);
    }

    return currentBuild >= (Platform.OS === "ios" ? minBuildNumber : minVersionCode);

  } catch (e) {
    return true; // fail open
  }
};

