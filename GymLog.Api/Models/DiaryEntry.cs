using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("DiaryEntries")]
public class DiaryEntry
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    public User User { get; set; } = null!;

    [Required]
    public int FoodId { get; set; }

    public Food Food { get; set; } = null!;

    [Required]
    public DateOnly Date { get; set; }

    [Required]
    public MealType MealType { get; set; }

    [Required]
    [Column(TypeName = "numeric(7,2)")]
    public decimal Grams { get; set; }
}
