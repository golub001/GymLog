namespace GymLog.Api.DTOs
{
    public class FriendDto
    {
        public int FriendshipId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string? AvatarUrl { get; set; }
    }

    public class FriendRequestDto
    {
        public int FriendshipId { get; set; }
        public int UserId { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string? AvatarUrl { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class UserSearchResultDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = "";
        public string Email { get; set; } = "";
        public string? AvatarUrl { get; set; }
        public string Status { get; set; } = "none";
        public int? FriendshipId { get; set; }
    }
}
