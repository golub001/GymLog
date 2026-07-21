using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class SendMessageDto
    {
        [Required]
        [MaxLength(1000)]
        public string Content { get; set; } = "";
    }

    public class MessageDto
    {
        public int Id { get; set; }
        public int SenderId { get; set; }
        public string SenderName { get; set; } = "";
        public int ReceiverId { get; set; }
        public string Content { get; set; } = "";
        public DateTime SentAt { get; set; }
    }

    public class ConversationDto
    {
        public int FriendUserId { get; set; }
        public string FriendName { get; set; } = "";
        public string LastMessage { get; set; } = "";
        public DateTime LastSentAt { get; set; }
        public int UnreadCount { get; set; }
    }
}
