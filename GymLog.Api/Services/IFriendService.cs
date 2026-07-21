using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface IFriendService
    {
        public Task<List<UserSearchResultDto>> SearchUsers(int userId, string query);
        public Task<(bool Ok, string? Error)> SendRequest(int userId, int targetUserId);
        public Task<bool> AcceptRequest(int userId, int friendshipId);
        public Task<bool> RemoveFriendship(int userId, int friendshipId);
        public Task<List<FriendDto>> GetFriends(int userId);
        public Task<List<FriendRequestDto>> GetIncomingRequests(int userId);
    }
}
