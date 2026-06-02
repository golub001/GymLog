namespace GymLog.Api.DTOs
{
    public class WorkoutDetailDto
    {
        public int Id { get; set; }
        public DateOnly Date { get; set; }
        public string? Notes { get; set; }
        public List<ExerciseBlockDto> Exercises { get; set; } = new();
    }

    public class ExerciseBlockDto
    {
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = "";
        public string MuscleGroup { get; set; } = "";
        public List<SetDto> Sets { get; set; } = new();
    }

    public class SetDto
    {
        public int SetOrder { get; set; }
        public decimal WeightKg { get; set; }
        public int Reps { get; set; }
    }
}
