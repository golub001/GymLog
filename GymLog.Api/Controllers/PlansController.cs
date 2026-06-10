using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("/api/plans")]
    [Authorize]
    public class PlansController : ControllerBase
    {
        private readonly IPlanService _planService;
        private readonly IAiPlanService _aiPlanService;
        public PlansController(IPlanService planService, IAiPlanService aiPlanService)
        {
            _planService = planService;
            _aiPlanService = aiPlanService;
        }

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("templates")]
        public async Task<IActionResult> GetTemplates()
        {
            return Ok(await _planService.GetTemplates());
        }

        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var plan = await _planService.GetActivePlan(UserId);
            if (plan == null) return NoContent();
            return Ok(plan);
        }

        [HttpGet]
        public async Task<IActionResult> GetMyPlans()
        {
            return Ok(await _planService.GetMyPlans(UserId));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPlanById(int id)
        {
            var plan = await _planService.GetPlanById(UserId, id);
            if (plan == null) return NotFound();
            return Ok(plan);
        }

        [HttpPost("from-template/{templateId}")]
        public async Task<IActionResult> UseTemplate(int templateId)
        {
            var id = await _planService.UseTemplate(UserId, templateId);
            if (id == null) return NotFound();
            return Ok(new { planId = id });
        }

        [HttpPost("{id}/activate")]
        public async Task<IActionResult> Activate(int id)
        {
            var ok = await _planService.ActivatePlan(UserId, id);
            if (!ok) return NotFound();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _planService.DeletePlan(UserId, id);
            if (!ok) return NotFound();
            return NoContent();
        }

        [HttpPost("generate")]
        public async Task<IActionResult> Generate(GeneratePlanDto dto)
        {
            var id = await _aiPlanService.GeneratePlan(
                UserId, dto.Prompt, dto.Equipment, dto.Days);
            if (id == null)
                return StatusCode(502, "AI plan generation failed. Please try again.");
            return Ok(new { planId = id });
        }

        [HttpPost("days/{dayId}/exercises")]
        public async Task<IActionResult> AddExercise(int dayId, AddPlanExerciseDto dto)
        {
            var id = await _planService.AddExerciseToDay(
                UserId, dayId, dto.ExerciseId, dto.TargetSets, dto.TargetReps);
            if (id == null) return NotFound();
            return Ok(new { planExerciseId = id });
        }

        [HttpDelete("exercises/{planExerciseId}")]
        public async Task<IActionResult> RemoveExercise(int planExerciseId)
        {
            var ok = await _planService.RemovePlanExercise(UserId, planExerciseId);
            if (!ok) return NotFound();
            return NoContent();
        }

        [HttpPatch("exercises/{planExerciseId}")]
        public async Task<IActionResult> UpdateExercise(int planExerciseId, UpdatePlanExerciseDto dto)
        {
            var ok = await _planService.UpdatePlanExercise(
                UserId, planExerciseId, dto.TargetSets, dto.TargetReps);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
