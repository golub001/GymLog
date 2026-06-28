import { api } from "./api";
import {
  ExerciseSearchItem,
  ExerciseDetail,
  NewWorkout,
  WorkoutDetail,
  MuscleStat,
  PersonalBest,
} from "../dto/workout";

export async function searchExercises(
  search: string,
  muscleGroup?: string,
  equipment?: string
): Promise<ExerciseSearchItem[]> {
  try {
    const response = await api.get<ExerciseSearchItem[]>("/workouts/exercises", {
      params: { search, muscleGroup, equipment },
    });
    return response.data;
  } catch {
    return [];
  }
}

export async function getExerciseById(
  id: number
): Promise<ExerciseDetail | null> {
  try {
    const response = await api.get<ExerciseDetail>(`/workouts/exercises/${id}`);
    return response.data;
  } catch {
    return null;
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

export async function getStreak(): Promise<number> {
  try {
    const response = await api.get<{ streak: number }>("/workouts/streak");
    return response.data.streak;
  } catch {
    return 0;
  }
}

export async function getPersonalBests(): Promise<PersonalBest[]> {
  try {
    const response = await api.get<PersonalBest[]>("/workouts/personal-bests");
    return response.data;
  } catch {
    return [];
  }
}
