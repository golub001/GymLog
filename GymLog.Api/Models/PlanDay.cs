using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("PlanDays")]
public class PlanDay
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PlanId { get; set; }

    public Plan Plan { get; set; } = null!;

    [Required]
    [MaxLength(60)]
    public string Name { get; set; } = string.Empty;

    public int DayOfWeek { get; set; }

    public int Order { get; set; }

    public ICollection<PlanExercise> Exercises { get; set; } = new List<PlanExercise>();
}
