import { api } from "./api";
import { WeightEntry } from "../dto/weight";

export async function getWeights(): Promise<WeightEntry[]> {
  try {
    const response = await api.get<WeightEntry[]>("/bodyweight");
    return response.data;
  } catch {
    return [];
  }
}

export async function insertWeight(
  date: string,
  weightKg: number
): Promise<number | null> {
  try {
    const response = await api.post<{ id: number }>("/bodyweight", {
      date,
      weightKg,
    });
    return response.data.id;
  } catch {
    return null;
  }
}
