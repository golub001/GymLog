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
