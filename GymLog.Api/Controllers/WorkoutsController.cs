using GymLog.Api.DTOs;
using GymLog.Api.Models;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("/api/workouts")]
    [Authorize]
    public class WorkoutsController:ControllerBase
    {
        private readonly IWorkoutService _workoutService;
        public WorkoutsController(IWorkoutService workoutService)
        {
            _workoutService = workoutService;
        }
        [HttpPost("insert")]
        public async Task<IActionResult> InsertNewWorkout(NewWorkoutDto dto)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            try
            {
                var result =await _workoutService.InsertNewWorkout(dto.WorkoutSets, userId, dto.Date, dto.Notes??"", dto.PlanDayId);
                return Ok(new { workoutId = result });
            }
            catch (Exception)
            {
                return StatusCode(500, "Failed to save workout.");
            }
        }
        [HttpGet("exercises")]
        public async Task<IActionResult> SearchExercises([FromQuery] string? search, [FromQuery] string? muscleGroup, [FromQuery] string? equipment)
        {
            return Ok(await _workoutService.SearchExercises(search ?? "", muscleGroup ?? "", equipment ?? ""));
        }

        [HttpGet("exercises/{id}")]
        public async Task<IActionResult> GetExerciseById(int id)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var exercise = await _workoutService.GetExerciseById(id, userId);
            if (exercise == null) return NotFound();
            return Ok(exercise);
        }

        [HttpGet("personal-bests")]
        public async Task<IActionResult> GetPersonalBests()
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _workoutService.GetPersonalBests(userId));
        }

        [HttpGet("dates")]
        public async Task<IActionResult> CalendarForWorkouts([FromQuery] int year, [FromQuery] int month)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _workoutService.SearchActiveDays(userId, year, month));
        }

        [HttpGet("by-date")]
        public async Task<IActionResult> GetWorkoutForDate([FromQuery] DateOnly date)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _workoutService.GetWorkoutsByDate(userId, date));
        }

        [HttpGet("streak")]
        public async Task<IActionResult> GetStreak()
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(new { streak = await _workoutService.GetStreak(userId) });
        }

        [HttpGet("muscle-stats")]
        public async Task<IActionResult> GetMuscleStats()
        {
            return Ok(await _workoutService.GetWeeklyMuscleStats(int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!)));
        }
    }
}
