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
  isCustom: boolean;
};

export type NewFood = {
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
  avatarUrl: string | null;
  dailyCalorieGoal: number | null;
  dailyProteinGoal: number | null;
  sex: "Male" | "Female" | null;
  birthDate: string | null;
  heightCm: number | null;
  activityLevel: "Sedentary" | "Moderate" | "Active" | null;
  goalType: "LoseWeight" | "GainMass" | "Maintain" | null;
  latestWeightKg: number | null;
};

export type NutritionSummary = {
  days: number;
  loggedDays: number;
  avgKcal: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
};
