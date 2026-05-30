using GymLog.Api.Data;
using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _db;
        private readonly ICalorieCalculator _calculator;

        public UserService(AppDbContext db, ICalorieCalculator calc)
        {
            _db = db;
            _calculator = calc;
        }

        public OnboardingResultDto CalculatePlan(OnboardingDto dto)
        {
            int age = CalculateAge(dto.BirthDate);
            return _calculator.CalculateOptions(
                dto.Sex, age, dto.HeightCm, dto.WeightKg,
                dto.ActivityLevel, dto.GoalType);
        }

        public async Task<bool> CompleteOnboardingAsync(int userId, OnboardingFinishDto dto)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null)
            {
                return false;
            }

            var p = dto.Profile;

            user.Sex = p.Sex;
            user.BirthDate = p.BirthDate;
            user.HeightCm = p.HeightCm;
            user.ActivityLevel = p.ActivityLevel;
            user.GoalType = p.GoalType;
            user.DailyCalorieGoal = dto.CalorieGoal;
            user.DailyProteinGoal = (int)Math.Round((double)p.WeightKg * 1.8);

            await _db.SaveChangesAsync();
            return true;
        }

        public int CalculateAge(DateOnly birthDate)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            int age = today.Year - birthDate.Year;
            if (birthDate > today.AddYears(-age)) age--;
            return age;
        }
    }
}
