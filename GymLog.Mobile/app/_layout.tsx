import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { colors } from "../theme/colors";
import { StatusBar } from "expo-status-bar";
import * as SystemUI from "expo-system-ui";
import LoadingOverlay from "../components/LoadingOverlay";

SystemUI.setBackgroundColorAsync(colors.bg);

function RootLayoutNav() {
  const { token, onboardingDone, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [initialDone, setInitialDone] = useState(false);

  const inAuthGroup = segments[0] === "(auth)";
  const inOnboarding = segments[0] === "onboarding";
  const needsLogin = !token && !inAuthGroup;
  const needsOnboarding = !!token && !onboardingDone && !inOnboarding;

  useEffect(() => {
    if (loading) return;

    if (!token) {
      if (!inAuthGroup) router.replace("/login");
    } else if (!onboardingDone) {
      if (!inOnboarding) router.replace("/onboarding");
    } else {
      if (inAuthGroup || inOnboarding) router.replace("/" as any);
    }
  }, [token, onboardingDone, loading, segments]);

  useEffect(() => {
    if (!loading && !needsLogin && !needsOnboarding && !initialDone) {
      setInitialDone(true);
    }
  }, [loading, needsLogin, needsOnboarding, initialDone]);

  const showLoading = loading || (!initialDone && (needsLogin || needsOnboarding));

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 220,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />

      <LoadingOverlay visible={showLoading} />
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
