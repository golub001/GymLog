using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("Plans")]
public class Plan
{
    [Key]
    public int Id { get; set; }

    public int? UserId { get; set; }

    public User? User { get; set; }

    [Required]
    [MaxLength(120)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(300)]
    public string? Description { get; set; }

    [Required]
    public PlanSource Source { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<PlanDay> Days { get; set; } = new List<PlanDay>();
}
