using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Hubs;
using GymLog.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class FriendService : IFriendService
    {
        private readonly AppDbContext _database;
        private readonly IPushService _push;
        private readonly IHubContext<ChatHub> _hub;

        public FriendService(AppDbContext database, IPushService push, IHubContext<ChatHub> hub)
        {
            _database = database;
            _push = push;
            _hub = hub;
        }

        private async Task NotifyFriendUpdate(int toUserId, string kind, string fromName)
        {
            await _hub.Clients.User(toUserId.ToString())
                .SendAsync("FriendUpdate", new { kind, name = fromName });

            var token = await _database.Users
                .Where(u => u.Id == toUserId)
                .Select(u => u.ExpoPushToken)
                .FirstOrDefaultAsync();

            if (kind == "request")
            {
                await _push.SendPush(token, "Friend request 👥",
                    $"{fromName} sent you a friend request.",
                    new { type = "friend" });
            }
            else
            {
                await _push.SendPush(token, "Request accepted ✅",
                    $"{fromName} accepted your friend request.",
                    new { type = "friend" });
            }
        }

        public async Task<List<UserSearchResultDto>> SearchUsers(int userId, string query)
        {
            if (string.IsNullOrWhiteSpace(query) || query.Trim().Length < 2)
                return new List<UserSearchResultDto>();

            var pattern = $"%{query.Trim()}%";

            var users = await _database.Users
                .Where(u => u.Id != userId &&
                    (EF.Functions.ILike(u.Name, pattern) || EF.Functions.ILike(u.Email, pattern)))
                .OrderBy(u => u.Name)
                .Take(20)
                .Select(u => new { u.Id, u.Name, u.Email })
                .ToListAsync();

            var ids = users.Select(u => u.Id).ToList();

            var links = await _database.Friendships
                .Where(f =>
                    (f.RequesterId == userId && ids.Contains(f.AddresseeId)) ||
                    (f.AddresseeId == userId && ids.Contains(f.RequesterId)))
                .ToListAsync();

            return users.Select(u =>
            {
                var link = links.FirstOrDefault(f =>
                    f.RequesterId == u.Id || f.AddresseeId == u.Id);

                string status = "none";
                if (link != null)
                {
                    if (link.Status == FriendshipStatus.Accepted)
                        status = "friends";
                    else if (link.RequesterId == userId)
                        status = "pending_sent";
                    else
                        status = "pending_received";
                }

                return new UserSearchResultDto
                {
                    UserId = u.Id,
                    Name = u.Name,
                    Email = u.Email,
                    Status = status,
                    FriendshipId = link?.Id
                };
            }).ToList();
        }

        public async Task<(bool Ok, string? Error)> SendRequest(int userId, int targetUserId)
        {
            if (userId == targetUserId)
                return (false, "You cannot add yourself.");

            var targetExists = await _database.Users.AnyAsync(u => u.Id == targetUserId);
            if (!targetExists)
                return (false, "User not found.");

            var existing = await _database.Friendships.FirstOrDefaultAsync(f =>
                (f.RequesterId == userId && f.AddresseeId == targetUserId) ||
                (f.RequesterId == targetUserId && f.AddresseeId == userId));

            var senderName = await _database.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Name)
                .FirstAsync();

            if (existing != null)
            {
                if (existing.Status == FriendshipStatus.Accepted)
                    return (false, "You are already friends.");

                if (existing.RequesterId == userId)
                    return (false, "Request already sent.");

                existing.Status = FriendshipStatus.Accepted;
                await _database.SaveChangesAsync();
                await NotifyFriendUpdate(targetUserId, "accepted", senderName);
                return (true, null);
            }

            var friendship = new Friendship
            {
                RequesterId = userId,
                AddresseeId = targetUserId,
                Status = FriendshipStatus.Pending
            };

            await _database.Friendships.AddAsync(friendship);
            await _database.SaveChangesAsync();
            await NotifyFriendUpdate(targetUserId, "request", senderName);
            return (true, null);
        }

        public async Task<bool> AcceptRequest(int userId, int friendshipId)
        {
            var friendship = await _database.Friendships.FirstOrDefaultAsync(f =>
                f.Id == friendshipId &&
                f.AddresseeId == userId &&
                f.Status == FriendshipStatus.Pending);

            if (friendship == null) return false;

            friendship.Status = FriendshipStatus.Accepted;
            await _database.SaveChangesAsync();

            var accepterName = await _database.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Name)
                .FirstAsync();
            await NotifyFriendUpdate(friendship.RequesterId, "accepted", accepterName);

            return true;
        }

        public async Task<bool> RemoveFriendship(int userId, int friendshipId)
        {
            var friendship = await _database.Friendships.FirstOrDefaultAsync(f =>
                f.Id == friendshipId &&
                (f.RequesterId == userId || f.AddresseeId == userId));

            if (friendship == null) return false;

            _database.Friendships.Remove(friendship);
            await _database.SaveChangesAsync();
            return true;
        }

        public async Task<List<FriendDto>> GetFriends(int userId)
        {
            return await _database.Friendships
                .Where(f => f.Status == FriendshipStatus.Accepted &&
                    (f.RequesterId == userId || f.AddresseeId == userId))
                .Select(f => new FriendDto
                {
                    FriendshipId = f.Id,
                    UserId = f.RequesterId == userId ? f.AddresseeId : f.RequesterId,
                    Name = f.RequesterId == userId ? f.Addressee.Name : f.Requester.Name,
                    Email = f.RequesterId == userId ? f.Addressee.Email : f.Requester.Email
                })
                .OrderBy(f => f.Name)
                .ToListAsync();
        }

        public async Task<List<FriendRequestDto>> GetIncomingRequests(int userId)
        {
            return await _database.Friendships
                .Where(f => f.AddresseeId == userId && f.Status == FriendshipStatus.Pending)
                .OrderByDescending(f => f.CreatedAt)
                .Select(f => new FriendRequestDto
                {
                    FriendshipId = f.Id,
                    UserId = f.RequesterId,
                    Name = f.Requester.Name,
                    Email = f.Requester.Email,
                    CreatedAt = f.CreatedAt
                })
                .ToListAsync();
        }
    }
}
