using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public interface ICalorieCalculator
    {
        // Vraca proteine + 3 opcije tempa (za mrsavljenje/gojenje) ili 1 (za odrzavanje)
        OnboardingResultDto CalculateOptions(
            Sex sex, int age, int heightCm, decimal weightKg,
            ActivityLevel activityLevel, GoalType goalType);
    }
}
