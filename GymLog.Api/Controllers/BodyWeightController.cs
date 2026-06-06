using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("/api/bodyweight")]
    [Authorize]
    public class BodyWeightController : ControllerBase
    {
        private readonly IBodyWeightService _bodyWeightService;
        public BodyWeightController(IBodyWeightService bodyWeightService)
        {
            _bodyWeightService = bodyWeightService;
        }

        [HttpPost]
        public async Task<IActionResult> InsertWeight(NewWeightDto dto)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var result = await _bodyWeightService.InsertWeight(userId, dto.Date, dto.WeightKg);
            return Ok(new { id = result });
        }

        [HttpGet]
        public async Task<IActionResult> GetWeights()
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            return Ok(await _bodyWeightService.GetWeights(userId));
        }
    }
}
