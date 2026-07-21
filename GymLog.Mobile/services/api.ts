import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_HOST = "http://10.0.2.2:5166";

export const api = axios.create({
  baseURL: `${API_HOST}/api`,
  headers: { "Content-Type": "application/json" },
});

let onAuthFailure: (() => void) | null = null;

export function setOnAuthFailure(callback: () => void): void {
  onAuthFailure = callback;
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await axios.post(`${API_HOST}/api/auth/refresh`, {
      refreshToken,
    });
    const { token, refreshToken: newRefresh } = response.data;
    if (!token || !newRefresh) return null;

    await SecureStore.setItemAsync("authToken", token);
    await SecureStore.setItemAsync("refreshToken", newRefresh);
    return token;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const isAuthRoute = original?.url?.includes("/auth/");

    if (status !== 401 || isAuthRoute || original?._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;

    if (newToken) {
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    }

    await SecureStore.deleteItemAsync("authToken");
    await SecureStore.deleteItemAsync("refreshToken");
    onAuthFailure?.();
    return Promise.reject(error);
  }
);
