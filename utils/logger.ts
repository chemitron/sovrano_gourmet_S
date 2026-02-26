// utils/logger.ts
// Centralized logger that works in Expo Go and switches to Crashlytics in EAS builds

let crashlytics: any = null;

try {
  // Only available once you add @react-native-firebase/crashlytics in a custom dev client / EAS build
  crashlytics = require('@react-native-firebase/crashlytics').default;
} catch (e) {
  // In Expo Go, Crashlytics isn't available — fallback to console
  crashlytics = null;
}

export function logError(message: string, error?: any) {
  if (__DEV__) {
    // Expo Go / dev builds → console
    console.error(`[ERROR] ${message}`, error);
  } else if (crashlytics) {
    // EAS build → Crashlytics
    crashlytics().recordError(error);
    crashlytics().log(message);
  } else {
    // Fallback if Crashlytics not linked
    console.error(`[ERROR] ${message}`, error);
  }
}

export function logInfo(message: string, data?: any) {
  if (__DEV__) {
    //console.log(`[INFO] ${message}`, data ?? "");
  } else if (crashlytics) {
    crashlytics().log(`${message} ${data ? JSON.stringify(data) : ""}`);
  } else {
    //console.log(`[INFO] ${message}`, data ?? "");
  }
}

export function logWarn(message: string, data?: any) {
  if (__DEV__) {
    console.warn(`[WARN] ${message}`, data ?? "");
  } else if (crashlytics) {
    crashlytics().log(`WARN: ${message} ${data ? JSON.stringify(data) : ""}`);
  } else {
    console.warn(`[WARN] ${message}`, data ?? "");
  }
}

export function setUserContext(uid: string, role?: string, email?: string) {
  if (crashlytics) {
    crashlytics().setUserId(uid);
    if (role) crashlytics().setAttribute("role", role);
    if (email) crashlytics().setAttribute("email", email);
  } else {
    // In Expo Go, just log it
    //console.log(`[USER CONTEXT] uid=${uid}, role=${role}, email=${email}`);
  }
}
