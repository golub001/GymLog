import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";

SystemUI.setBackgroundColorAsync(colors.bg);

function RootLayoutNav() {
  const { token, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      router.replace("/login");
    } else if (token && inAuthGroup) {
      router.replace("/" as any);
    }
  }, [token, loading, segments]);

  if (loading) return null;

  const inAuthGroup = segments[0] === "(auth)";
  if (!token && !inAuthGroup) return null;

  return (
  <>
    <StatusBar style="light" />
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
        animationDuration: 250,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: "none" }} />

    </Stack>
  </>
);
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}