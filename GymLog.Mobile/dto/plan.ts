export type PlanListItem = {
  id: number;
  name: string;
  description: string | null;
  source: string;
  dayCount: number;
  isActive: boolean;
  isTemplate: boolean;
};

export type PlanExercise = {
  id: number;
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  equipment: string | null;
  imageUrl: string | null;
  targetSets: number;
  targetReps: number;
  order: number;
};

export type PlanDay = {
  id: number;
  name: string;
  dayOfWeek: number;
  order: number;
  exercises: PlanExercise[];
};

export type PlanDetail = {
  id: number;
  name: string;
  description: string | null;
  source: string;
  isActive: boolean;
  isTemplate: boolean;
  days: PlanDay[];
};

export const WEEKDAY_NAMES = [
  "",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function weekdayName(dow: number): string {
  return WEEKDAY_NAMES[dow] ?? "";
}

export function todayDayOfWeek(): number {
  const js = new Date().getDay();
  return ((js + 6) % 7) + 1;
}
