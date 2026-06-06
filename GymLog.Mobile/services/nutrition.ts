import { api } from "./api";
import {
  DiaryDay,
  FoodSearchItem,
  MealType,
  UserProfile,
} from "../dto/nutrition";

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
