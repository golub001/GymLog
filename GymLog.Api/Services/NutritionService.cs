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

        public async Task<List<FoodSearchItemDto>> SearchFoods(string pattern)
        {
            return await _database.Foods
                .Where(f => f.Name.Contains(pattern))
                .OrderBy(f => f.Name)
                .Take(20)
                .Select(f => new FoodSearchItemDto
                {
                    Id = f.Id,
                    Name = f.Name,
                    KcalPer100g = f.KcalPer100g,
                    ProteinPer100g = f.ProteinPer100g,
                    CarbsPer100g = f.CarbsPer100g,
                    FatPer100g = f.FatPer100g
                })
                .ToListAsync();
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
    }
}
