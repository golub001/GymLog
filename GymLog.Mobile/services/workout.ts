import { api } from "./api";
import {
  ExerciseSearchItem,
  NewWorkout,
  WorkoutDetail,
  MuscleStat,
} from "../dto/workout";

export async function searchExercises(
  search: string
): Promise<ExerciseSearchItem[]> {
  try {
    const response = await api.get<ExerciseSearchItem[]>("/workouts/exercises", {
      params: { search },
    });
    return response.data;
  } catch {
    return [];
  }
}

export async function insertWorkout(
  payload: NewWorkout
): Promise<number | null> {
  try {
    const response = await api.post<{ workoutId: number }>(
      "/workouts/insert",
      payload
    );
    return response.data.workoutId;
  } catch {
    return null;
  }
}

export async function getActiveDays(
  year: number,
  month: number
): Promise<string[]> {
  try {
    const response = await api.get<string[]>("/workouts/dates", {
      params: { year, month },
    });
    return response.data;
  } catch {
    return [];
  }
}

export async function getWorkoutsByDate(
  date: string
): Promise<WorkoutDetail[]> {
  try {
    const response = await api.get<WorkoutDetail[]>("/workouts/by-date", {
      params: { date },
    });
    return response.data;
  } catch {
    return [];
  }
}

export async function getMuscleStats(): Promise<MuscleStat[]> {
  try {
    const response = await api.get<MuscleStat[]>("/workouts/muscle-stats");
    return response.data;
  } catch {
    return [];
  }
}
