using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("Foods")]
public class Food
{
    [Key]
    public int Id { get; set; }

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "numeric(7,2)")]
    public decimal KcalPer100g { get; set; }

    [Column(TypeName = "numeric(6,2)")]
    public decimal ProteinPer100g { get; set; }

    [Column(TypeName = "numeric(6,2)")]
    public decimal CarbsPer100g { get; set; }

    [Column(TypeName = "numeric(6,2)")]
    public decimal FatPer100g { get; set; }
}
