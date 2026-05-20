import { api } from "./api";
import { AuthResult, LoginRequest, RegisterRequest } from "../dto/auth";

export async function login(data: LoginRequest): Promise<AuthResult> {
  try {
    const response = await api.post<AuthResult>("/auth/login", data);
    return response.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data ?? "Network error" };
  }
}

export async function register(data: RegisterRequest): Promise<AuthResult> {
  try {
    const response = await api.post<AuthResult>("/auth/register", data);
    return response.data;
  } catch (err: any) {
    return { success: false, error: err.response?.data?.error ?? "Network error" };
  }
}