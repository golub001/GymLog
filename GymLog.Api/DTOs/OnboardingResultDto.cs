namespace GymLog.Api.DTOs
{
    public class OnboardingResultDto
    {
        public int Protein { get; set; }
        public List<PlanOptionDto> Options { get; set; } = new();
    }
}
