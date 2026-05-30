import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "authToken";
const ONBOARDING_KEY = "onboardingDone";

type AuthContextType = {
  token: string | null;
  onboardingDone: boolean;
  loading: boolean;
  signIn: (token: string, onboardingDone: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const start = Date.now();

      const savedToken = await SecureStore.getItemAsync(TOKEN_KEY);
      const savedOnboarding = await SecureStore.getItemAsync(ONBOARDING_KEY);
      setToken(savedToken);
      setOnboardingDone(savedOnboarding === "true");

      const minDelay = 800;
      const elapsed = Date.now() - start;
      if (elapsed < minDelay) {
        await new Promise((resolve) => setTimeout(resolve, minDelay - elapsed));
      }

      setLoading(false);
    }
    load();
  }, []);

  async function signIn(newToken: string, done: boolean) {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    await SecureStore.setItemAsync(ONBOARDING_KEY, done ? "true" : "false");
    setToken(newToken);
    setOnboardingDone(done);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(ONBOARDING_KEY);
    setToken(null);
    setOnboardingDone(false);
  }

  async function completeOnboarding() {
    await SecureStore.setItemAsync(ONBOARDING_KEY, "true");
    setOnboardingDone(true);
  }

  return (
    <AuthContext.Provider
      value={{ token, onboardingDone, loading, signIn, signOut, completeOnboarding }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
