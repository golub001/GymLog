using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface ISessionService
    {
        public Task<(bool Ok, string? Error)> Create(int userId, CreateSessionDto dto);
        public Task<(bool Found, string? Error)> Accept(int userId, int sessionId);
        public Task<bool> Decline(int userId, int sessionId);
        public Task<bool> Cancel(int userId, int sessionId);
        public Task<List<SessionDto>> GetSessions(int userId);
    }
}
