using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("/api/friends")]
    [Authorize]
    public class FriendsController : ControllerBase
    {
        private readonly IFriendService _friendService;

        public FriendsController(IFriendService friendService)
        {
            _friendService = friendService;
        }

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> GetFriends()
        {
            return Ok(await _friendService.GetFriends(UserId));
        }

        [HttpGet("requests")]
        public async Task<IActionResult> GetIncomingRequests()
        {
            return Ok(await _friendService.GetIncomingRequests(UserId));
        }

        [HttpGet("search")]
        public async Task<IActionResult> SearchUsers([FromQuery] string? query)
        {
            return Ok(await _friendService.SearchUsers(UserId, query ?? ""));
        }

        [HttpPost("request/{targetUserId}")]
        public async Task<IActionResult> SendRequest(int targetUserId)
        {
            var (ok, error) = await _friendService.SendRequest(UserId, targetUserId);
            if (!ok) return BadRequest(error);
            return Ok();
        }

        [HttpPost("accept/{friendshipId}")]
        public async Task<IActionResult> AcceptRequest(int friendshipId)
        {
            var ok = await _friendService.AcceptRequest(UserId, friendshipId);
            if (!ok) return NotFound();
            return Ok();
        }

        [HttpDelete("{friendshipId}")]
        public async Task<IActionResult> RemoveFriendship(int friendshipId)
        {
            var ok = await _friendService.RemoveFriendship(UserId, friendshipId);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
