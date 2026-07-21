using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("SessionParticipants")]
public class SessionParticipant
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int SessionId { get; set; }

    public ScheduledSession Session { get; set; } = null!;

    [Required]
    public int UserId { get; set; }

    public User User { get; set; } = null!;

    [Required]
    public SessionStatus Status { get; set; } = SessionStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
