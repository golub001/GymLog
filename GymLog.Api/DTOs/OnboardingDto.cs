using GymLog.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class OnboardingDto
    {
        [Required]
        public Sex Sex { get; set; }
        [Required]
        public DateOnly BirthDate {  get; set; }
        [Required]
        [Range(100,250)]
        public int HeightCm {  get; set; }
        [Required]
        [Range(30,300)]
        public decimal WeightKg { get; set; }

        [Required]
        public ActivityLevel ActivityLevel { get; set; }

        [Required]
        public GoalType GoalType { get; set; }
    }
}
