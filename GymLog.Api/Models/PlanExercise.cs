using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("PlanExercises")]
public class PlanExercise
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int PlanDayId { get; set; }

    public PlanDay PlanDay { get; set; } = null!;

    [Required]
    public int ExerciseId { get; set; }

    public Exercise Exercise { get; set; } = null!;

    [Required]
    public int TargetSets { get; set; }

    [Required]
    public int TargetReps { get; set; }

    public int Order { get; set; }
}
