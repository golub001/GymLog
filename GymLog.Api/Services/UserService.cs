using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _database;
        private readonly ICalorieCalculator _calculator;

        public UserService(AppDbContext db, ICalorieCalculator calc)
        {
            _database = db;
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
            var user = await _database.Users.FindAsync(userId);
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

            _database.BodyWeights.Add(new BodyWeight
            {
                UserId = userId,
                Date = DateOnly.FromDateTime(DateTime.UtcNow),
                WeightKg = p.WeightKg
            });

            await _database.SaveChangesAsync();
            return true;
        }

        public async Task<UserProfileDto?> GetProfile(int userId)
        {
            var user = await _database.Users.FindAsync(userId);
            if (user == null) return null;

            return new UserProfileDto
            {
                Name = user.Name,
                DailyCalorieGoal = user.DailyCalorieGoal,
                DailyProteinGoal = user.DailyProteinGoal
            };
        }

        public async Task<bool> SavePushToken(int userId, string token)
        {
            var user = await _database.Users.FindAsync(userId);
            if (user == null) return false;

            user.ExpoPushToken = token;
            await _database.SaveChangesAsync();
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
