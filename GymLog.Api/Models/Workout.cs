using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("Workouts")]
public class Workout
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    public User User { get; set; } = null!;

    [Required]
    public DateOnly Date { get; set; }

    public string? Notes { get; set; }

    public int? PlanDayId { get; set; }

    public PlanDay? PlanDay { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<WorkoutSet> Sets { get; set; } = new List<WorkoutSet>();
}
