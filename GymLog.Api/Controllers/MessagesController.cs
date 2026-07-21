using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("/api/messages")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessagesController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            return Ok(await _messageService.GetConversations(UserId));
        }

        [HttpGet("unread-count")]
        public async Task<IActionResult> GetUnreadCount()
        {
            return Ok(new { count = await _messageService.GetUnreadCount(UserId) });
        }

        [HttpGet("{friendUserId}")]
        public async Task<IActionResult> GetConversation(
            int friendUserId, [FromQuery] int take = 50, [FromQuery] int? beforeId = null)
        {
            return Ok(await _messageService.GetConversation(UserId, friendUserId, take, beforeId));
        }

        [HttpPost("{friendUserId}")]
        public async Task<IActionResult> Send(int friendUserId, SendMessageDto dto)
        {
            var (message, error) = await _messageService.SendMessage(UserId, friendUserId, dto.Content);
            if (message == null) return BadRequest(error);
            return Ok(message);
        }

        [HttpPost("{friendUserId}/read")]
        public async Task<IActionResult> MarkRead(int friendUserId)
        {
            await _messageService.MarkRead(UserId, friendUserId);
            return Ok();
        }
    }
}
