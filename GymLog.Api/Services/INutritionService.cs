using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public interface INutritionService
    {
        Task<List<FoodSearchItemDto>> SearchFoods(string pattern);
        Task<int> InsertDiaryEntry(int userId, int foodId, DateOnly date, MealType mealType, decimal grams);
        Task<DiaryDayDto> GetDiary(int userId, DateOnly date);
        Task<bool> DeleteDiaryEntry(int userId, int entryId);
        Task<NutritionSummaryDto> GetSummary(int userId, int days);
    }
}
