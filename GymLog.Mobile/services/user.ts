import { api } from "./api";
import { OnboardingData, OnboardingResult } from "../dto/onboarding";

export async function calculatePlan(
  data: OnboardingData
): Promise<OnboardingResult | null> {
  try {
    const response = await api.post<OnboardingResult>(
      "/users/onboarding/calculate",
      data
    );
    return response.data;
  } catch {
    return null;
  }
}

export async function completeOnboarding(
  data: OnboardingData,
  calorieGoal: number
): Promise<boolean> {
  try {
    await api.post("/users/onboarding", { profile: data, calorieGoal });
    return true;
  } catch {
    return false;
  }
}

export async function updateGoals(
  data: OnboardingData,
  calorieGoal: number
): Promise<boolean> {
  try {
    await api.post("/users/goals", { profile: data, calorieGoal });
    return true;
  } catch {
    return false;
  }
}

export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.post("/users/change-password", { currentPassword, newPassword });
    return { ok: true };
  } catch (err: any) {
    const message =
      typeof err?.response?.data === "string" && err.response.data.length > 0
        ? err.response.data
        : "Could not change password.";
    return { ok: false, error: message };
  }
}

export async function uploadAvatar(uri: string): Promise<string | null> {
  try {
    const form = new FormData();
    const name = uri.split("/").pop() ?? "avatar.jpg";
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1]}` : "image/jpeg";
    form.append("file", { uri, name, type } as any);

    const response = await api.post<{ avatarUrl: string }>(
      "/users/avatar",
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data.avatarUrl;
  } catch {
    return null;
  }
}
