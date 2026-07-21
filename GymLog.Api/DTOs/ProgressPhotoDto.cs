namespace GymLog.Api.DTOs
{
    public class ProgressPhotoDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = "";
        public DateOnly TakenAt { get; set; }
        public string? Note { get; set; }
    }
}
