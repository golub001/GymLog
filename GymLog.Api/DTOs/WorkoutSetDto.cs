using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class WorkoutSetDto
    {
        
        public int ExerciseId { get; set; }

        [Range(0, 600)]
        public decimal WeightKg { get; set; }

        [Range(1,1000)]
        public int Reps {  get; set; }
    }
}
