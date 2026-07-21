using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class CreateSessionDto
    {
        [Required]
        public DateTime ScheduledAt { get; set; }

        [Required]
        [MinLength(1)]
        public List<int> FriendUserIds { get; set; } = new();

        [MaxLength(255)]
        public string? Note { get; set; }

        [MaxLength(100)]
        public string? LocationName { get; set; }

        public double? LocationLat { get; set; }

        public double? LocationLng { get; set; }
    }

    public class SessionParticipantDto
    {
        public int UserId { get; set; }
        public string Name { get; set; } = "";
        public string Status { get; set; } = "";
    }

    public class SessionDto
    {
        public int Id { get; set; }
        public int HostUserId { get; set; }
        public string HostName { get; set; } = "";
        public bool IsHost { get; set; }
        public DateTime ScheduledAt { get; set; }
        public string? Note { get; set; }
        public string? LocationName { get; set; }
        public double? LocationLat { get; set; }
        public double? LocationLng { get; set; }
        public string MyStatus { get; set; } = "";
        public List<SessionParticipantDto> Participants { get; set; } = new();
    }
}
