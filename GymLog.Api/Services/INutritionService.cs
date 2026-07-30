using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public interface INutritionService
    {
        Task<List<FoodSearchItemDto>> SearchFoods(int userId, string pattern);
        Task<FoodSearchItemDto> CreateFood(int userId, NewFoodDto dto);
        Task<(bool Ok, string? Error)> DeleteFood(int userId, int foodId);
        Task<int> InsertDiaryEntry(int userId, int foodId, DateOnly date, MealType mealType, decimal grams);
        Task<DiaryDayDto> GetDiary(int userId, DateOnly date);
        Task<bool> DeleteDiaryEntry(int userId, int entryId);
        Task<NutritionSummaryDto> GetSummary(int userId, int days);
    }
}
