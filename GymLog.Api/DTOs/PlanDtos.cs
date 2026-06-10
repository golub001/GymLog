namespace GymLog.Api.DTOs
{
    public class PlanListItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string Source { get; set; } = "";
        public int DayCount { get; set; }
        public bool IsActive { get; set; }
        public bool IsTemplate { get; set; }
    }

    public class AddPlanExerciseDto
    {
        public int ExerciseId { get; set; }
        public int TargetSets { get; set; }
        public int TargetReps { get; set; }
    }

    public class UpdatePlanExerciseDto
    {
        public int TargetSets { get; set; }
        public int TargetReps { get; set; }
    }

    public class PlanExerciseDto
    {
        public int Id { get; set; }
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = "";
        public string MuscleGroup { get; set; } = "";
        public string? Equipment { get; set; }
        public string? ImageUrl { get; set; }
        public int TargetSets { get; set; }
        public int TargetReps { get; set; }
        public int Order { get; set; }
    }

    public class PlanDayDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public int DayOfWeek { get; set; }
        public int Order { get; set; }
        public List<PlanExerciseDto> Exercises { get; set; } = new();
    }

    public class PlanDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string? Description { get; set; }
        public string Source { get; set; } = "";
        public bool IsActive { get; set; }
        public bool IsTemplate { get; set; }
        public List<PlanDayDto> Days { get; set; } = new();
    }
}
