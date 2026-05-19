using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;
[Table("Users")]
public class User
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? PhotoUrl { get; set; }

    public Sex? Sex { get; set; }

    public DateOnly? BirthDate { get; set; }

    public int? HeightCm { get; set; }

    public ActivityLevel? ActivityLevel { get; set; }

    public GoalType? GoalType { get; set; }

    public int? DailyCalorieGoal { get; set; }

    public int? DailyProteinGoal { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
