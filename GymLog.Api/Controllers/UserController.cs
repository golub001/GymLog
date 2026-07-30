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

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var (ok, error) = await _userService.ChangePasswordAsync(
                userId, dto.CurrentPassword, dto.NewPassword);
            if (!ok) return BadRequest(error);
            return Ok(new { message = "Password changed." });
        }

        public class AvatarForm
        {
            public IFormFile File { get; set; } = null!;
        }

        [HttpPost("avatar")]
        public async Task<IActionResult> UploadAvatar([FromForm] AvatarForm form)
        {
            if (form.File == null || form.File.Length == 0)
                return BadRequest("No file uploaded.");
            if (!form.File.ContentType.StartsWith("image/"))
                return BadRequest("Only image files are allowed.");

            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var url = await _userService.SaveAvatar(userId, form.File);
            if (url == null) return NotFound();
            return Ok(new { avatarUrl = url });
        }

        [HttpPost("onboarding/calculate")]
        public IActionResult Calculate(OnboardingDto dto)
        {
            var result = _userService.CalculatePlan(dto);
            return Ok(result);
        }

        [HttpPost("goals")]
        public async Task<IActionResult> UpdateGoals(OnboardingFinishDto dto)
        {
            int userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            bool ok = await _userService.UpdateGoalsAsync(userId, dto);
            if (!ok) return NotFound("User not found");
            return Ok(new { message = "Goals updated!" });
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
