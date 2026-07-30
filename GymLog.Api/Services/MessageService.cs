using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Hubs;
using GymLog.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class MessageService : IMessageService
    {
        private readonly AppDbContext _database;
        private readonly IHubContext<ChatHub> _hub;
        private readonly IPushService _push;

        public MessageService(AppDbContext database, IHubContext<ChatHub> hub, IPushService push)
        {
            _database = database;
            _hub = hub;
            _push = push;
        }

        public async Task<(MessageDto? Dto, string? Error)> SendMessage(int senderId, int receiverId, string content)
        {
            content = content?.Trim() ?? "";
            if (content.Length == 0)
                return (null, "Message cannot be empty.");
            if (content.Length > 1000)
                return (null, "Message is too long.");
            if (senderId == receiverId)
                return (null, "You cannot message yourself.");

            var areFriends = await _database.Friendships.AnyAsync(f =>
                f.Status == FriendshipStatus.Accepted &&
                ((f.RequesterId == senderId && f.AddresseeId == receiverId) ||
                 (f.RequesterId == receiverId && f.AddresseeId == senderId)));

            if (!areFriends)
                return (null, "You can only message friends.");

            var senderName = await _database.Users
                .Where(u => u.Id == senderId)
                .Select(u => u.Name)
                .FirstAsync();

            var message = new Message
            {
                SenderId = senderId,
                ReceiverId = receiverId,
                Content = content
            };

            await _database.Messages.AddAsync(message);
            await _database.SaveChangesAsync();

            var dto = new MessageDto
            {
                Id = message.Id,
                SenderId = senderId,
                SenderName = senderName,
                ReceiverId = receiverId,
                Content = content,
                SentAt = message.SentAt
            };

            await _hub.Clients.User(receiverId.ToString())
                .SendAsync("ReceiveMessage", dto);

            if (!ChatPresence.IsOnline(receiverId.ToString()))
            {
                var receiverToken = await _database.Users
                    .Where(u => u.Id == receiverId)
                    .Select(u => u.ExpoPushToken)
                    .FirstOrDefaultAsync();

                var preview = content.Length > 80 ? content[..80] + "…" : content;
                await _push.SendPush(receiverToken, senderName, preview,
                    new { type = "message", friendUserId = senderId, friendName = senderName });
            }

            return (dto, null);
        }

        public async Task<List<MessageDto>> GetConversation(int userId, int friendUserId, int take = 50, int? beforeId = null)
        {
            var query = _database.Messages.Where(m =>
                (m.SenderId == userId && m.ReceiverId == friendUserId) ||
                (m.SenderId == friendUserId && m.ReceiverId == userId));

            if (beforeId != null)
                query = query.Where(m => m.Id < beforeId);

            var messages = await query
                .OrderByDescending(m => m.Id)
                .Take(take)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    SenderId = m.SenderId,
                    SenderName = m.Sender.Name,
                    ReceiverId = m.ReceiverId,
                    Content = m.Content,
                    SentAt = m.SentAt
                })
                .ToListAsync();

            messages.Reverse();
            return messages;
        }

        public async Task<List<ConversationDto>> GetConversations(int userId)
        {
            var messages = await _database.Messages
                .Where(m => m.SenderId == userId || m.ReceiverId == userId)
                .OrderByDescending(m => m.Id)
                .Select(m => new
                {
                    m.Id,
                    m.SenderId,
                    m.ReceiverId,
                    m.Content,
                    m.SentAt,
                    m.ReadAt,
                    OtherId = m.SenderId == userId ? m.ReceiverId : m.SenderId
                })
                .ToListAsync();

            var byFriend = messages.GroupBy(m => m.OtherId).ToList();
            var friendIds = byFriend.Select(g => g.Key).ToList();

            var users = await _database.Users
                .Where(u => friendIds.Contains(u.Id))
                .Select(u => new { u.Id, u.Name, u.AvatarFileName })
                .ToDictionaryAsync(u => u.Id, u => u);

            return byFriend.Select(g =>
            {
                var last = g.First();
                var friend = users.GetValueOrDefault(g.Key);
                return new ConversationDto
                {
                    FriendUserId = g.Key,
                    FriendName = friend?.Name ?? "Unknown",
                    FriendAvatarUrl = UserService.AvatarUrl(friend?.AvatarFileName),
                    LastMessage = last.Content,
                    LastSentAt = last.SentAt,
                    UnreadCount = g.Count(m => m.ReceiverId == userId && m.ReadAt == null)
                };
            })
            .OrderByDescending(c => c.LastSentAt)
            .ToList();
        }

        public async Task MarkRead(int userId, int friendUserId)
        {
            await _database.Messages
                .Where(m => m.SenderId == friendUserId &&
                            m.ReceiverId == userId &&
                            m.ReadAt == null)
                .ExecuteUpdateAsync(s => s.SetProperty(m => m.ReadAt, DateTime.UtcNow));
        }

        public async Task<int> GetUnreadCount(int userId)
        {
            return await _database.Messages
                .CountAsync(m => m.ReceiverId == userId && m.ReadAt == null);
        }
    }
}
