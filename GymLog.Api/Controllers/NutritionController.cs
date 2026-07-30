using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("/api/nutrition")]
    [Authorize]
    public class NutritionController : ControllerBase
    {
        private readonly INutritionService _nutritionService;
        public NutritionController(INutritionService nutritionService)
        {
            _nutritionService = nutritionService;
        }

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("foods")]
        public async Task<IActionResult> SearchFoods([FromQuery] string search)
        {
            return Ok(await _nutritionService.SearchFoods(UserId, search ?? ""));
        }

        [HttpPost("foods")]
        public async Task<IActionResult> CreateFood(NewFoodDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Name is required.");
            if (dto.KcalPer100g <= 0)
                return BadRequest("Calories must be greater than zero.");

            var food = await _nutritionService.CreateFood(UserId, dto);
            return Ok(food);
        }

        [HttpDelete("foods/{foodId}")]
        public async Task<IActionResult> DeleteFood(int foodId)
        {
            var (ok, error) = await _nutritionService.DeleteFood(UserId, foodId);
            if (!ok) return BadRequest(error);
            return NoContent();
        }

        [HttpPost("diary")]
        public async Task<IActionResult> InsertDiaryEntry(NewDiaryEntryDto dto)
        {
            var id = await _nutritionService.InsertDiaryEntry(UserId, dto.FoodId, dto.Date, dto.MealType, dto.Grams);
            return Ok(new { id });
        }

        [HttpGet("diary")]
        public async Task<IActionResult> GetDiary([FromQuery] DateOnly date)
        {
            return Ok(await _nutritionService.GetDiary(UserId, date));
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] int days = 7)
        {
            return Ok(await _nutritionService.GetSummary(UserId, days));
        }

        [HttpDelete("diary/{entryId}")]
        public async Task<IActionResult> DeleteDiaryEntry(int entryId)
        {
            var ok = await _nutritionService.DeleteDiaryEntry(UserId, entryId);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
