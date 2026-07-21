using System.Collections.Concurrent;
using System.Security.Claims;
using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace GymLog.Api.Hubs
{
    public static class ChatPresence
    {
        private static readonly ConcurrentDictionary<string, int> Online = new();

        public static void Connected(string userId) =>
            Online.AddOrUpdate(userId, 1, (_, count) => count + 1);

        public static void Disconnected(string userId)
        {
            if (Online.AddOrUpdate(userId, 0, (_, count) => count - 1) <= 0)
                Online.TryRemove(userId, out _);
        }

        public static bool IsOnline(string userId) =>
            Online.TryGetValue(userId, out var count) && count > 0;
    }

    [Authorize]
    public class ChatHub : Hub
    {
        private readonly IMessageService _messageService;

        public ChatHub(IMessageService messageService)
        {
            _messageService = messageService;
        }

        private string UserId =>
            Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!;

        public override Task OnConnectedAsync()
        {
            ChatPresence.Connected(UserId);
            return base.OnConnectedAsync();
        }

        public override Task OnDisconnectedAsync(Exception? exception)
        {
            ChatPresence.Disconnected(UserId);
            return base.OnDisconnectedAsync(exception);
        }

        public async Task<MessageDto?> SendMessage(int receiverId, string content)
        {
            var (dto, _) = await _messageService.SendMessage(
                int.Parse(UserId), receiverId, content);
            return dto;
        }
    }
}
