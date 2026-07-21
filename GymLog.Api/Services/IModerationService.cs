namespace GymLog.Api.Services
{
    public class ModerationResult
    {
        public bool Ok { get; set; }
        public bool HasFace { get; set; }
        public bool IsNsfw { get; set; }
        public string? Reason { get; set; }
        public bool ServiceAvailable { get; set; } = true;
    }

    public interface IModerationService
    {
        public Task<ModerationResult> CheckImage(IFormFile file);
    }
}
