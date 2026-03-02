import { Stack } from "expo-router";
import { InvitadoProvider } from "../src/context/InvitadoContext";

export default function RootLayout() {
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
