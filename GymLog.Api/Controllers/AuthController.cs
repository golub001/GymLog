using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace GymLog.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _service;

        public AuthController(IAuthService service) {
            _service = service;
        }

        [HttpPost]
        [Route("register")]
        public async Task<IActionResult> Register(RegisterDto dto)
        {
            var result = await _service.RegisterAsync(dto);

            if (!result.Success)
            {
                return BadRequest(result.Error);
            }

            return Ok(result);
        }
        [HttpPost]
        [Route("login")]
        public async Task<IActionResult> Login(LoginDto dto)
        {
            var result = await _service.LoginAsync(dto);

            if (!result.Success)
            {
                return BadRequest(result.Error);
            }
            return Ok(result);
        }

        [HttpPost]
        [Route("refresh")]
        public async Task<IActionResult> Refresh(RefreshRequestDto dto)
        {
            var result = await _service.RefreshAsync(dto.RefreshToken);

            if (!result.Success)
            {
                return Unauthorized(result.Error);
            }
            return Ok(result);
        }

        [HttpPost]
        [Route("logout")]
        public async Task<IActionResult> Logout(RefreshRequestDto dto)
        {
            await _service.LogoutAsync(dto.RefreshToken);
            return Ok();
        }
    }
}
