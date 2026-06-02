namespace GymLog.Api.DTOs
{
    public class ExerciseSearchItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string MuscleGroup { get; set; } = "";
        public string? Equipment { get; set; }
        public string? ImageUrl { get; set; }
    }
}
