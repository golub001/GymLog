using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class NutritionService : INutritionService
    {
        private readonly AppDbContext _database;
        public NutritionService(AppDbContext database)
        {
            _database = database;
        }

        public async Task<List<FoodSearchItemDto>> SearchFoods(int userId, string pattern)
        {
            var p = (pattern ?? "").ToLower();
            return await _database.Foods
                .Where(f =>
                    (f.CreatedByUserId == null || f.CreatedByUserId == userId) &&
                    EF.Functions.ILike(f.Name, $"%{p}%"))
                // own custom foods first, then names starting with the term, then shortest
                .OrderByDescending(f => f.CreatedByUserId == userId)
                .ThenByDescending(f => EF.Functions.ILike(f.Name, $"{p}%"))
                .ThenBy(f => f.Name.Length)
                .Take(20)
                .Select(f => new FoodSearchItemDto
                {
                    Id = f.Id,
                    Name = f.Name,
                    KcalPer100g = f.KcalPer100g,
                    ProteinPer100g = f.ProteinPer100g,
                    CarbsPer100g = f.CarbsPer100g,
                    FatPer100g = f.FatPer100g,
                    IsCustom = f.CreatedByUserId != null
                })
                .ToListAsync();
        }

        public async Task<FoodSearchItemDto> CreateFood(int userId, NewFoodDto dto)
        {
            var food = new Food
            {
                Name = dto.Name.Trim(),
                KcalPer100g = dto.KcalPer100g,
                ProteinPer100g = dto.ProteinPer100g,
                CarbsPer100g = dto.CarbsPer100g,
                FatPer100g = dto.FatPer100g,
                CreatedByUserId = userId
            };

            await _database.Foods.AddAsync(food);
            await _database.SaveChangesAsync();

            return new FoodSearchItemDto
            {
                Id = food.Id,
                Name = food.Name,
                KcalPer100g = food.KcalPer100g,
                ProteinPer100g = food.ProteinPer100g,
                CarbsPer100g = food.CarbsPer100g,
                FatPer100g = food.FatPer100g,
                IsCustom = true
            };
        }

        public async Task<(bool Ok, string? Error)> DeleteFood(int userId, int foodId)
        {
            var food = await _database.Foods
                .FirstOrDefaultAsync(f => f.Id == foodId && f.CreatedByUserId == userId);
            if (food == null) return (false, "Custom food not found.");

            if (await _database.DiaryEntries.AnyAsync(e => e.FoodId == foodId))
                return (false, "This food is used in your diary and can't be deleted.");

            _database.Foods.Remove(food);
            await _database.SaveChangesAsync();
            return (true, null);
        }

        public async Task<int> InsertDiaryEntry(int userId, int foodId, DateOnly date, MealType mealType, decimal grams)
        {
            DiaryEntry entry = new DiaryEntry
            {
                UserId = userId,
                FoodId = foodId,
                Date = date,
                MealType = mealType,
                Grams = grams
            };

            await _database.DiaryEntries.AddAsync(entry);
            await _database.SaveChangesAsync();
            return entry.Id;
        }

        public async Task<DiaryDayDto> GetDiary(int userId, DateOnly date)
        {
            var entries = await _database.DiaryEntries
                .Where(e => e.UserId == userId && e.Date == date)
                .Include(e => e.Food)
                .OrderBy(e => e.Id)
                .ToListAsync();

            var items = entries.Select(e =>
            {
                var factor = e.Grams / 100m;
                return new DiaryEntryDto
                {
                    Id = e.Id,
                    FoodId = e.FoodId,
                    FoodName = e.Food.Name,
                    MealType = e.MealType.ToString(),
                    Grams = e.Grams,
                    Kcal = Math.Round(e.Food.KcalPer100g * factor, 1),
                    Protein = Math.Round(e.Food.ProteinPer100g * factor, 1),
                    Carbs = Math.Round(e.Food.CarbsPer100g * factor, 1),
                    Fat = Math.Round(e.Food.FatPer100g * factor, 1)
                };
            }).ToList();

            return new DiaryDayDto
            {
                Date = date,
                TotalKcal = items.Sum(i => i.Kcal),
                TotalProtein = items.Sum(i => i.Protein),
                TotalCarbs = items.Sum(i => i.Carbs),
                TotalFat = items.Sum(i => i.Fat),
                Entries = items
            };
        }

        public async Task<bool> DeleteDiaryEntry(int userId, int entryId)
        {
            var entry = await _database.DiaryEntries
                .FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId);
            if (entry == null) return false;

            _database.DiaryEntries.Remove(entry);
            await _database.SaveChangesAsync();
            return true;
        }

        public async Task<NutritionSummaryDto> GetSummary(int userId, int days)
        {
            if (days < 1) days = 7;
            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var since = today.AddDays(-(days - 1));

            var entries = await _database.DiaryEntries
                .Where(e => e.UserId == userId && e.Date >= since && e.Date <= today)
                .Include(e => e.Food)
                .ToListAsync();

            var loggedDays = entries.Select(e => e.Date).Distinct().Count();
            decimal kcal = 0, protein = 0, carbs = 0, fat = 0;
            foreach (var e in entries)
            {
                var factor = e.Grams / 100m;
                kcal += e.Food.KcalPer100g * factor;
                protein += e.Food.ProteinPer100g * factor;
                carbs += e.Food.CarbsPer100g * factor;
                fat += e.Food.FatPer100g * factor;
            }

            int divisor = loggedDays > 0 ? loggedDays : 1;
            return new NutritionSummaryDto
            {
                Days = days,
                LoggedDays = loggedDays,
                AvgKcal = Math.Round(kcal / divisor, 0),
                AvgProtein = Math.Round(protein / divisor, 0),
                AvgCarbs = Math.Round(carbs / divisor, 0),
                AvgFat = Math.Round(fat / divisor, 0)
            };
        }
    }
}
