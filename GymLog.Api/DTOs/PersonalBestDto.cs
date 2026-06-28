namespace GymLog.Api.DTOs
{
    public class PersonalBestDto
    {
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = "";
        public string MuscleGroup { get; set; } = "";
        public decimal WeightKg { get; set; }
        public int Reps { get; set; }
    }
}
