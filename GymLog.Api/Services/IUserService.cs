using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface IUserService
    {
        OnboardingResultDto CalculatePlan(OnboardingDto dto);

        Task<bool> CompleteOnboardingAsync(int userId, OnboardingFinishDto dto);
    }
}
