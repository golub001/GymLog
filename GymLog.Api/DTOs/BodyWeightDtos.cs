using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class NewWeightDto
    {
        [Required]
        public DateOnly Date { get; set; }

        [Required]
        [Range(20, 500)]
        public decimal WeightKg { get; set; }
    }

    public class WeightEntryDto
    {
        public DateOnly Date { get; set; }
        public decimal WeightKg { get; set; }
    }
}
