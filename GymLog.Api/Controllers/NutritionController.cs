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
            return Ok(await _nutritionService.SearchFoods(search ?? ""));
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

        [HttpDelete("diary/{entryId}")]
        public async Task<IActionResult> DeleteDiaryEntry(int entryId)
        {
            var ok = await _nutritionService.DeleteDiaryEntry(UserId, entryId);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
