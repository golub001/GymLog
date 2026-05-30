namespace GymLog.Api.DTOs
{
    public class OnboardingFinishDto
    {
        public OnboardingDto Profile { get; set; } = null!;
        public int CalorieGoal { get; set; }
    }
}
