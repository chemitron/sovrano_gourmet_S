import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { InvitadoProvider } from "../src/context/InvitadoContext";
import { checkAppVersion } from "../utils/checkVersion";

export default function RootLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const verify = async () => {
      console.log("=== [RootLayout] Version check starting ===");
      const allowed = await checkAppVersion();
      console.log("[RootLayout] Version check result:", allowed);

      if (!allowed) {
        console.log("[RootLayout] Redirecting to /update-required");
        router.replace("/update-required");
        return;
      }

      console.log("[RootLayout] Version allowed → rendering app");
      setChecked(true);
    };

    verify();
  }, []);

  if (!checked) {
    console.log("[RootLayout] Waiting for version check → render null");
    return null;
  }

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
