namespace GymLog.Api.DTOs
{
    public class ExerciseDetailDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public string MuscleGroup { get; set; } = "";
        public string? Equipment { get; set; }
        public string? Instructions { get; set; }
        public string? ImageUrl { get; set; }
        public string? GifUrl { get; set; }
    }
}
