import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { InvitadoProvider } from "../src/context/InvitadoContext";
import UpdateRequiredScreen from "../src/screens/update-required";
import { checkAppVersion } from "../utils/checkVersion";

export default function RootLayout() {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const verify = async () => {
      const ok = await checkAppVersion();

      setAllowed(ok);
      setChecked(true);
    };

    verify();
  }, []);

  // ⏳ Show loader while checking version
  if (!checked) {

    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "white",
        }}
      >
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  // ❗ Outdated → render update screen directly (NO navigation)
  if (allowed === false) {
    return <UpdateRequiredScreen />;
  }

  // Allowed → render the app normally
  return (
    <InvitadoProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerBackVisible: true,
        }}
      />
    </InvitadoProvider>
  );
}

