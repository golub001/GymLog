using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Hubs;
using GymLog.Api.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class SessionService : ISessionService
    {
        private readonly AppDbContext _database;
        private readonly IPushService _push;
        private readonly IHubContext<ChatHub> _hub;

        public SessionService(AppDbContext database, IPushService push, IHubContext<ChatHub> hub)
        {
            _database = database;
            _push = push;
            _hub = hub;
        }

        private static readonly TimeSpan ConflictWindow = TimeSpan.FromMinutes(60);

        private async Task<bool> HasConflict(int userId, DateTime scheduledAt, bool acceptedOnly, int? ignoreSessionId = null)
        {
            var from = scheduledAt - ConflictWindow;
            var to = scheduledAt + ConflictWindow;

            return await _database.ScheduledSessions.AnyAsync(s =>
                s.ScheduledAt > from && s.ScheduledAt < to &&
                (ignoreSessionId == null || s.Id != ignoreSessionId) &&
                (s.HostId == userId ||
                 s.Participants.Any(p => p.UserId == userId &&
                    (acceptedOnly
                        ? p.Status == SessionStatus.Accepted
                        : p.Status != SessionStatus.Declined))));
        }

        public async Task<(bool Ok, string? Error)> Create(int userId, CreateSessionDto dto)
        {
            if (dto.ScheduledAt <= DateTime.UtcNow)
                return (false, "Session time must be in the future.");

            var friendIds = (dto.FriendUserIds ?? new())
                .Distinct()
                .Where(id => id != userId)
                .ToList();

            if (friendIds.Count == 0)
                return (false, "Invite at least one friend.");

            var friendships = await _database.Friendships.Where(f =>
                f.Status == FriendshipStatus.Accepted &&
                ((f.RequesterId == userId && friendIds.Contains(f.AddresseeId)) ||
                 (f.AddresseeId == userId && friendIds.Contains(f.RequesterId))))
                .ToListAsync();

            var friendSet = friendships
                .Select(f => f.RequesterId == userId ? f.AddresseeId : f.RequesterId)
                .ToHashSet();

            if (friendIds.Any(id => !friendSet.Contains(id)))
                return (false, "You can only invite friends.");

            if (await HasConflict(userId, dto.ScheduledAt, acceptedOnly: false))
                return (false, "You already have a session around that time.");

            var hasPin = dto.LocationLat != null && dto.LocationLng != null;
            var session = new ScheduledSession
            {
                HostId = userId,
                ScheduledAt = dto.ScheduledAt,
                Note = dto.Note,
                LocationName = hasPin ? dto.LocationName : null,
                LocationLat = hasPin ? dto.LocationLat : null,
                LocationLng = hasPin ? dto.LocationLng : null,
                Participants = friendIds
                    .Select(id => new SessionParticipant { UserId = id })
                    .ToList()
            };

            await _database.ScheduledSessions.AddAsync(session);
            await _database.SaveChangesAsync();

            var hostName = await _database.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Name)
                .FirstAsync();

            var invitees = await _database.Users
                .Where(u => friendIds.Contains(u.Id))
                .Select(u => new { u.Id, u.ExpoPushToken })
                .ToListAsync();

            var localTime = dto.ScheduledAt.ToLocalTime();
            var locationPart = string.IsNullOrWhiteSpace(session.LocationName)
                ? ""
                : $" · 📍 {session.LocationName}";

            foreach (var invitee in invitees)
            {
                await _push.SendPush(
                    invitee.ExpoPushToken,
                    "Workout invite 💪",
                    $"{hostName} invited you to train on {localTime:ddd, MMM d} at {localTime:HH:mm}{locationPart}",
                    new { type = "session" });

                await _hub.Clients.User(invitee.Id.ToString()).SendAsync(
                    "SessionUpdate",
                    new
                    {
                        kind = "invite",
                        name = hostName,
                        scheduledAt = session.ScheduledAt,
                        locationName = session.LocationName
                    });
            }

            return (true, null);
        }

        public async Task<(bool Found, string? Error)> Accept(int userId, int sessionId)
        {
            var participant = await _database.SessionParticipants
                .Include(p => p.Session)
                .Include(p => p.User)
                .FirstOrDefaultAsync(p =>
                    p.SessionId == sessionId &&
                    p.UserId == userId &&
                    p.Status == SessionStatus.Pending);

            if (participant == null) return (false, null);

            if (await HasConflict(userId, participant.Session.ScheduledAt, acceptedOnly: true, ignoreSessionId: sessionId))
                return (true, "You already have an accepted session around that time.");

            participant.Status = SessionStatus.Accepted;
            await _database.SaveChangesAsync();

            await NotifyHost(participant.Session.HostId, "accepted",
                "Invite accepted ✅",
                $"{participant.User.Name} accepted your workout invite.",
                participant.User.Name);

            return (true, null);
        }

        public async Task<bool> Decline(int userId, int sessionId)
        {
            var participant = await _database.SessionParticipants
                .Include(p => p.Session)
                .Include(p => p.User)
                .FirstOrDefaultAsync(p =>
                    p.SessionId == sessionId &&
                    p.UserId == userId &&
                    p.Status != SessionStatus.Declined);

            if (participant == null) return false;

            participant.Status = SessionStatus.Declined;
            await _database.SaveChangesAsync();

            await NotifyHost(participant.Session.HostId, "declined",
                "Invite declined",
                $"{participant.User.Name} can't make it this time.",
                participant.User.Name);

            return true;
        }

        private async Task NotifyHost(int hostId, string kind, string title, string body, string fromName)
        {
            var hostToken = await _database.Users
                .Where(u => u.Id == hostId)
                .Select(u => u.ExpoPushToken)
                .FirstOrDefaultAsync();

            await _push.SendPush(hostToken, title, body, new { type = "session" });

            await _hub.Clients.User(hostId.ToString()).SendAsync(
                "SessionUpdate",
                new { kind, name = fromName });
        }

        public async Task<bool> Cancel(int userId, int sessionId)
        {
            var session = await _database.ScheduledSessions
                .Include(s => s.Participants)
                .FirstOrDefaultAsync(s => s.Id == sessionId);

            if (session == null) return false;

            if (session.HostId != userId)
            {
                return await Decline(userId, sessionId);
            }

            var hostName = await _database.Users
                .Where(u => u.Id == userId)
                .Select(u => u.Name)
                .FirstAsync();

            var recipientIds = session.Participants
                .Where(p => p.Status != SessionStatus.Declined)
                .Select(p => p.UserId)
                .ToList();

            var recipients = await _database.Users
                .Where(u => recipientIds.Contains(u.Id))
                .Select(u => new { u.Id, u.ExpoPushToken })
                .ToListAsync();

            var localTime = session.ScheduledAt.ToLocalTime();

            _database.ScheduledSessions.Remove(session);
            await _database.SaveChangesAsync();

            foreach (var recipient in recipients)
            {
                await _push.SendPush(
                    recipient.ExpoPushToken,
                    "Session cancelled",
                    $"{hostName} cancelled the workout on {localTime:ddd, MMM d} at {localTime:HH:mm}.",
                    new { type = "session" });

                await _hub.Clients.User(recipient.Id.ToString()).SendAsync(
                    "SessionUpdate",
                    new { kind = "cancelled", name = hostName });
            }

            return true;
        }

        public async Task<List<SessionDto>> GetSessions(int userId)
        {
            var cutoff = DateTime.UtcNow.AddHours(-12);

            return await _database.ScheduledSessions
                .Where(s => s.ScheduledAt >= cutoff &&
                    (s.HostId == userId ||
                     s.Participants.Any(p => p.UserId == userId && p.Status != SessionStatus.Declined)))
                .OrderBy(s => s.ScheduledAt)
                .Select(s => new SessionDto
                {
                    Id = s.Id,
                    HostUserId = s.HostId,
                    HostName = s.Host.Name,
                    IsHost = s.HostId == userId,
                    ScheduledAt = s.ScheduledAt,
                    Note = s.Note,
                    LocationName = s.LocationName,
                    LocationLat = s.LocationLat,
                    LocationLng = s.LocationLng,
                    MyStatus = s.HostId == userId
                        ? "Accepted"
                        : s.Participants
                            .Where(p => p.UserId == userId)
                            .Select(p => p.Status.ToString())
                            .First(),
                    Participants = s.Participants
                        .OrderBy(p => p.CreatedAt)
                        .Select(p => new SessionParticipantDto
                        {
                            UserId = p.UserId,
                            Name = p.User.Name,
                            Status = p.Status.ToString()
                        })
                        .ToList()
                })
                .ToListAsync();
        }
    }
}
