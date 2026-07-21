import { api } from "./api";
import { AuthResult, LoginRequest, RegisterRequest } from "../dto/auth";

function extractError(err: any): string {
  const data = err?.response?.data;
  if (typeof data === "string" && data.length > 0) return data;
  if (typeof data?.error === "string") return data.error;
  if (data?.errors && typeof data.errors === "object") {
    const first = Object.values(data.errors)[0];
    if (Array.isArray(first) && first.length > 0) return String(first[0]);
  }
  if (typeof data?.title === "string") return data.title;
  return "Cannot reach the server. Check your connection.";
}

export async function login(data: LoginRequest): Promise<AuthResult> {
  try {
    const response = await api.post<AuthResult>("/auth/login", data);
    return response.data;
  } catch (err: any) {
    return { success: false, error: extractError(err) };
  }
}

export async function register(data: RegisterRequest): Promise<AuthResult> {
  try {
    const response = await api.post<AuthResult>("/auth/register", data);
    return response.data;
  } catch (err: any) {
    return { success: false, error: extractError(err) };
  }
}
