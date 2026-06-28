export type ExerciseSearchItem = {
  id: number;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  imageUrl: string | null;
};

export type WorkoutSetInput = {
  exerciseId: number;
  weightKg: number;
  reps: number;
};

export type NewWorkout = {
  workoutSets: WorkoutSetInput[];
  notes: string | null;
  date: string;
  planDayId?: number | null;
};

export type WorkoutSetDetail = {
  setOrder: number;
  weightKg: number;
  reps: number;
};

export type ExerciseBlock = {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  sets: WorkoutSetDetail[];
};

export type WorkoutDetail = {
  id: number;
  date: string;
  notes: string | null;
  exercises: ExerciseBlock[];
};

export type MuscleStat = {
  muscleGroup: string;
  setCount: number;
  targetSets: number;
};

export type PersonalBest = {
  exerciseId: number;
  exerciseName: string;
  muscleGroup: string;
  weightKg: number;
  reps: number;
};

export type ExerciseDetail = {
  id: number;
  name: string;
  muscleGroup: string;
  equipment: string | null;
  instructions: string | null;
  imageUrl: string | null;
  gifUrl: string | null;
  personalBest: PersonalBest | null;
};
