import { api } from "./api";
import {
  DiaryDay,
  FoodSearchItem,
  NewFood,
  MealType,
  UserProfile,
  NutritionSummary,
} from "../dto/nutrition";

export async function getNutritionSummary(
  days: number
): Promise<NutritionSummary | null> {
  try {
    const response = await api.get<NutritionSummary>("/nutrition/summary", {
      params: { days },
    });
    return response.data;
  } catch {
    return null;
  }
}

export async function searchFoods(
  search: string
): Promise<FoodSearchItem[]> {
  try {
    const response = await api.get<FoodSearchItem[]>("/nutrition/foods", {
      params: { search },
    });
    return response.data;
  } catch {
    return [];
  }
}

export async function createFood(
  food: NewFood
): Promise<{ ok: boolean; food?: FoodSearchItem; error?: string }> {
  try {
    const response = await api.post<FoodSearchItem>("/nutrition/foods", food);
    return { ok: true, food: response.data };
  } catch (err: any) {
    const message =
      typeof err?.response?.data === "string" && err.response.data.length > 0
        ? err.response.data
        : "Could not create food.";
    return { ok: false, error: message };
  }
}

export async function deleteFood(
  foodId: number
): Promise<{ ok: boolean; error?: string }> {
  try {
    await api.delete(`/nutrition/foods/${foodId}`);
    return { ok: true };
  } catch (err: any) {
    const message =
      typeof err?.response?.data === "string" && err.response.data.length > 0
        ? err.response.data
        : "Could not delete food.";
    return { ok: false, error: message };
  }
}

export async function getDiary(date: string): Promise<DiaryDay | null> {
  try {
    const response = await api.get<DiaryDay>("/nutrition/diary", {
      params: { date },
    });
    return response.data;
  } catch {
    return null;
  }
}

export async function insertDiaryEntry(
  foodId: number,
  date: string,
  mealType: MealType,
  grams: number
): Promise<number | null> {
  try {
    const response = await api.post<{ id: number }>("/nutrition/diary", {
      foodId,
      date,
      mealType,
      grams,
    });
    return response.data.id;
  } catch {
    return null;
  }
}

export async function deleteDiaryEntry(id: number): Promise<boolean> {
  try {
    await api.delete(`/nutrition/diary/${id}`);
    return true;
  } catch {
    return false;
  }
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const response = await api.get<UserProfile>("/users/me");
    return response.data;
  } catch {
    return null;
  }
}
