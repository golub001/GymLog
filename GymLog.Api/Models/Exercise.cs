using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("Exercises")]
public class Exercise
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public MuscleGroup MuscleGroup { get; set; }

    [MaxLength(100)]
    public string? Equipment { get; set; }

    public string? Instructions { get; set; }

    [MaxLength(500)]
    public string? YoutubeUrl { get; set; }
}
