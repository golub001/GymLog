using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface IMessageService
    {
        public Task<(MessageDto? Dto, string? Error)> SendMessage(int senderId, int receiverId, string content);
        public Task<List<MessageDto>> GetConversation(int userId, int friendUserId, int take = 50, int? beforeId = null);
        public Task<List<ConversationDto>> GetConversations(int userId);
        public Task MarkRead(int userId, int friendUserId);
        public Task<int> GetUnreadCount(int userId);
    }
}
