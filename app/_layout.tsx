import { Stack } from "expo-router";
import { StationProvider } from "../src/context/StationContext";

export default function RootLayout() {
  return (
    <StationProvider>
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackVisible: true,
      }}
    />
    </StationProvider>
  );
}
