import { Stack, router } from "expo-router";
import { useEffect, useState } from "react";
import { InvitadoProvider } from "../src/context/InvitadoContext";
import { checkAppVersion } from "../utils/checkVersion";

export default function RootLayout() {
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const verify = async () => {
      const allowed = await checkAppVersion();

      if (!allowed) {
        router.replace("/update-required");
        return;
      }

      setChecked(true);
    };

    verify();
  }, []);

  // Prevent rendering anything until version check completes
  if (!checked) return null;

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
