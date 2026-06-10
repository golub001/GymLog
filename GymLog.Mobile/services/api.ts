import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const api = axios.create({

  baseURL: "http://10.0.2.2:5166/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("authToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
