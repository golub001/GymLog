using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("/api/sessions")]
    [Authorize]
    public class SessionsController : ControllerBase
    {
        private readonly ISessionService _sessionService;

        public SessionsController(ISessionService sessionService)
        {
            _sessionService = sessionService;
        }

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> GetSessions()
        {
            return Ok(await _sessionService.GetSessions(UserId));
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateSessionDto dto)
        {
            var (ok, error) = await _sessionService.Create(UserId, dto);
            if (!ok) return BadRequest(error);
            return Ok();
        }

        [HttpPost("{id}/accept")]
        public async Task<IActionResult> Accept(int id)
        {
            var (found, error) = await _sessionService.Accept(UserId, id);
            if (!found) return NotFound();
            if (error != null) return BadRequest(error);
            return Ok();
        }

        [HttpPost("{id}/decline")]
        public async Task<IActionResult> Decline(int id)
        {
            var ok = await _sessionService.Decline(UserId, id);
            if (!ok) return NotFound();
            return Ok();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Cancel(int id)
        {
            var ok = await _sessionService.Cancel(UserId, id);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
