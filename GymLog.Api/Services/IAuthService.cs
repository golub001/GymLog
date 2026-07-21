using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface IAuthService
    {
        Task<AuthResult> RegisterAsync(RegisterDto dto);
        Task<AuthResult> LoginAsync(LoginDto dto);
        Task<AuthResult> RefreshAsync(string refreshToken);
        Task LogoutAsync(string refreshToken);
    }
}
