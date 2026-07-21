namespace GymLog.Api.DTOs
{
    public class AuthResult
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
        public string? Token { get; set; }
        public string? RefreshToken { get; set; }
        public bool? OnboardingCompleted {  get; set; }
    }

    public class RefreshRequestDto
    {
        public string RefreshToken { get; set; } = "";
    }
}
