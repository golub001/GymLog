using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _database;
        private readonly ICalorieCalculator _calculator;
        private readonly IWebHostEnvironment _env;

        public UserService(AppDbContext db, ICalorieCalculator calc, IWebHostEnvironment env)
        {
            _database = db;
            _calculator = calc;
            _env = env;
        }

        public static string? AvatarUrl(string? fileName) =>
            fileName == null ? null : $"/uploads/avatars/{fileName}";

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

            var latestWeight = await _database.BodyWeights
                .Where(w => w.UserId == userId)
                .OrderByDescending(w => w.Date)
                .Select(w => (decimal?)w.WeightKg)
                .FirstOrDefaultAsync();

            return new UserProfileDto
            {
                Name = user.Name,
                AvatarUrl = AvatarUrl(user.AvatarFileName),
                DailyCalorieGoal = user.DailyCalorieGoal,
                DailyProteinGoal = user.DailyProteinGoal,
                Sex = user.Sex,
                BirthDate = user.BirthDate,
                HeightCm = user.HeightCm,
                ActivityLevel = user.ActivityLevel,
                GoalType = user.GoalType,
                LatestWeightKg = latestWeight
            };
        }

        public async Task<bool> UpdateGoalsAsync(int userId, OnboardingFinishDto dto)
        {
            var user = await _database.Users.FindAsync(userId);
            if (user == null) return false;

            var p = dto.Profile;

            user.Sex = p.Sex;
            user.BirthDate = p.BirthDate;
            user.HeightCm = p.HeightCm;
            user.ActivityLevel = p.ActivityLevel;
            user.GoalType = p.GoalType;
            user.DailyCalorieGoal = dto.CalorieGoal;
            user.DailyProteinGoal = (int)Math.Round((double)p.WeightKg * 1.8);

            await _database.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SavePushToken(int userId, string token)
        {
            var user = await _database.Users.FindAsync(userId);
            if (user == null) return false;

            user.ExpoPushToken = token;
            await _database.SaveChangesAsync();
            return true;
        }

        public async Task<string?> SaveAvatar(int userId, IFormFile file)
        {
            var user = await _database.Users.FindAsync(userId);
            if (user == null) return null;

            var webRoot = _env.WebRootPath
                ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var dir = Path.Combine(webRoot, "uploads", "avatars");
            Directory.CreateDirectory(dir);

            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext)) ext = ".jpg";
            var fileName = $"{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(dir, fileName);

            using (var fs = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(fs);
            }

            // remove the previous avatar file if any
            if (!string.IsNullOrEmpty(user.AvatarFileName))
            {
                var old = Path.Combine(dir, user.AvatarFileName);
                if (File.Exists(old))
                {
                    try { File.Delete(old); } catch { }
                }
            }

            user.AvatarFileName = fileName;
            await _database.SaveChangesAsync();
            return AvatarUrl(fileName);
        }

        public async Task<(bool Ok, string? Error)> ChangePasswordAsync(int userId, string currentPassword, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(newPassword) || newPassword.Length < 6)
                return (false, "New password must be at least 6 characters.");

            var user = await _database.Users.FindAsync(userId);
            if (user == null) return (false, "User not found.");

            if (!BCrypt.Net.BCrypt.Verify(currentPassword, user.PasswordHash))
                return (false, "Current password is incorrect.");

            if (BCrypt.Net.BCrypt.Verify(newPassword, user.PasswordHash))
                return (false, "New password must be different from the current one.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _database.SaveChangesAsync();
            return (true, null);
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
