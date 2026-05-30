using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("WorkoutSets")]
public class WorkoutSet
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int WorkoutId { get; set; }

    public Workout Workout { get; set; } = null!;

    [Required]
    public int ExerciseId { get; set; }

    public Exercise Exercise { get; set; } = null!;

    [Required]
    [Column(TypeName = "numeric(6,2)")]
    public decimal WeightKg { get; set; }

    [Required]
    public int Reps { get; set; }

    [Required]
    public int SetOrder { get; set; }
}
