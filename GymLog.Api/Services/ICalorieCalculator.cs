using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public interface ICalorieCalculator
    {

        OnboardingResultDto CalculateOptions(
            Sex sex, int age, int heightCm, decimal weightKg,
            ActivityLevel activityLevel, GoalType goalType);
    }
}
