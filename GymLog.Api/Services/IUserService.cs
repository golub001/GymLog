using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface IUserService
    {
        OnboardingResultDto CalculatePlan(OnboardingDto dto);

        Task<bool> CompleteOnboardingAsync(int userId, OnboardingFinishDto dto);

        Task<UserProfileDto?> GetProfile(int userId);

        Task<bool> UpdateGoalsAsync(int userId, OnboardingFinishDto dto);

        Task<bool> SavePushToken(int userId, string token);

        Task<string?> SaveAvatar(int userId, IFormFile file);

        Task<(bool Ok, string? Error)> ChangePasswordAsync(int userId, string currentPassword, string newPassword);
    }
}
