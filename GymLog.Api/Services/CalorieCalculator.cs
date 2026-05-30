using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public class CalorieCalculator : ICalorieCalculator
    {
        private const double KcalPerKg = 7700.0;

        public OnboardingResultDto CalculateOptions(
            Sex sex, int age, int heightCm, decimal weightKg,
            ActivityLevel activityLevel, GoalType goalType)
        {
            double weight = (double)weightKg;

            double bmr = 10 * weight + 6.25 * heightCm - 5 * age;
            bmr += sex == Sex.Male ? 5 : -161;

            double factor = activityLevel switch
            {
                ActivityLevel.Sedentary => 1.2,
                ActivityLevel.Moderate => 1.55,
                ActivityLevel.Active => 1.725,
                _ => 1.2
            };
            double tdee = bmr * factor;

            int protein = (int)Math.Round(weight * 1.8);

            var result = new OnboardingResultDto { Protein = protein };

            if (goalType == GoalType.Maintain)
            {
                result.Options.Add(new PlanOptionDto
                {
                    Label = "Maintain",
                    WeeklyChangeKg = 0,
                    Calories = (int)Math.Round(tdee)
                });
                return result;
            }

            double[] rates = { 0.25, 0.5, 0.75 };
            string[] labels = { "Relaxed", "Standard", "Aggressive" };
            int sign = goalType == GoalType.LoseWeight ? -1 : 1;

            for (int i = 0; i < rates.Length; i++)
            {
                double dailyAdjustment = rates[i] * KcalPerKg / 7;
                double calories = tdee + sign * dailyAdjustment;

                result.Options.Add(new PlanOptionDto
                {
                    Label = labels[i],
                    WeeklyChangeKg = rates[i],
                    Calories = (int)Math.Round(calories)
                });
            }

            return result;
        }
    }
}
