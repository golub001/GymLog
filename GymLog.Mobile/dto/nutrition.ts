export type MealType = "Breakfast" | "Lunch" | "Dinner" | "Snack";

export const MEAL_TYPES: MealType[] = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snack",
];

export type FoodSearchItem = {
  id: number;
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

export type DiaryEntry = {
  id: number;
  foodId: number;
  foodName: string;
  mealType: MealType;
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type DiaryDay = {
  date: string;
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entries: DiaryEntry[];
};

export type UserProfile = {
  name: string;
  dailyCalorieGoal: number | null;
  dailyProteinGoal: number | null;
};
