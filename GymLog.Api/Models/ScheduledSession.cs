using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("ScheduledSessions")]
public class ScheduledSession
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int HostId { get; set; }

    public User Host { get; set; } = null!;

    [Required]
    public DateTime ScheduledAt { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    [MaxLength(100)]
    public string? LocationName { get; set; }

    public double? LocationLat { get; set; }

    public double? LocationLng { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<SessionParticipant> Participants { get; set; } = new List<SessionParticipant>();
}
