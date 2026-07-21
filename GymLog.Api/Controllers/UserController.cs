using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("api/users")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet("me")]
        public async Task<IActionResult> Me()
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var profile = await _userService.GetProfile(userId);
            if (profile == null) return NotFound();
            return Ok(profile);
        }

        [HttpPost("push-token")]
        public async Task<IActionResult> SavePushToken([FromBody] PushTokenDto dto)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var ok = await _userService.SavePushToken(userId, dto.Token);
            if (!ok) return NotFound();
            return Ok();
        }

        [HttpPost("onboarding/calculate")]
        public IActionResult Calculate(OnboardingDto dto)
        {
            var result = _userService.CalculatePlan(dto);
            return Ok(result);
        }

        [HttpPost("onboarding")]
        public async Task<IActionResult> Onboarding(OnboardingFinishDto dto)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? User.FindFirstValue("sub");
            if (userIdClaim == null)
            {
                return Unauthorized();
            }

            int userId = int.Parse(userIdClaim);
            bool ok = await _userService.CompleteOnboardingAsync(userId, dto);

            if (!ok)
            {
                return NotFound("User not found");
            }
            return Ok(new { message = "Onboarding completed!" });
        }
    }
}
