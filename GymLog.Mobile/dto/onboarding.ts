export type Sex = "Male" | "Female";
export type ActivityLevel = "Sedentary" | "Moderate" | "Active";
export type GoalType = "LoseWeight" | "GainMass" | "Maintain";

export type OnboardingData = {
  sex: Sex;
  birthDate: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goalType: GoalType;
};

export type PlanOption = {
  label: string;
  weeklyChangeKg: number;
  calories: number;
};

export type OnboardingResult = {
  protein: number;
  options: PlanOption[];
};
