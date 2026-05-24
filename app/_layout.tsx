import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { InvitadoProvider } from "../src/context/InvitadoContext";
import UpdateRequiredScreen from "../src/screens/update-required";
import { checkAppVersion } from "../utils/checkVersion";
// ⬆️ Make sure this path matches your project structure

export default function RootLayout() {
  const [checked, setChecked] = useState(false);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    const verify = async () => {
      console.log("=== [RootLayout] Version check starting ===");
      const ok = await checkAppVersion();
      console.log("[RootLayout] Version check result:", ok);

      setAllowed(ok);
      setChecked(true);
    };

    verify();
  }, []);

  // Still loading → show nothing (or a splash if you want)
  if (!checked) {
    console.log("[RootLayout] Waiting for version check → render null");
    return null;
  }

  // ❗ Outdated → render update screen directly (NO navigation)
  if (allowed === false) {
    console.log("[RootLayout] Rendering <UpdateRequiredScreen />");
    return <UpdateRequiredScreen />;
  }

  // Allowed → render the app normally
  console.log("[RootLayout] Rendering Stack");
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
