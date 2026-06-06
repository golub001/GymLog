using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("BodyWeights")]
public class BodyWeight
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    public User User { get; set; } = null!;

    [Required]
    public DateOnly Date { get; set; }

    [Required]
    [Column(TypeName = "numeric(5,2)")]
    public decimal WeightKg { get; set; }
}
