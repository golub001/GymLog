using BCrypt.Net;
using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;

namespace GymLog.Api.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _database;
        private readonly ITokenService _tokenService;
        private readonly int _refreshExpiryDays;

        public AuthService(AppDbContext database, ITokenService token, IConfiguration config)
        {
            _database = database;
            _tokenService = token;
            _refreshExpiryDays = config.GetValue<int>("Jwt:RefreshExpiryDays", 30);
        }

        private async Task<string> IssueRefreshTokenAsync(int userId)
        {
            var refresh = new RefreshToken
            {
                UserId = userId,
                Token = _tokenService.GenerateRefreshToken(),
                ExpiresAt = DateTime.UtcNow.AddDays(_refreshExpiryDays)
            };
            await _database.RefreshTokens.AddAsync(refresh);
            await _database.SaveChangesAsync();
            return refresh.Token;
        }

        public async Task<AuthResult> LoginAsync(LoginDto dto)
        {
            var user=await _database.Users.FirstOrDefaultAsync(u=> u.Email == dto.Email);
            if (user == null) {
                return new AuthResult { Success = false,Error= "Invalid email or password" };
            }
            bool flag = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
            if (!flag) {
                return new AuthResult { Success = false, Error = "Invalid email or password" };
            }
            return new AuthResult
            {
                Success = true,
                Token = _tokenService.GenerateAccessToken(user),
                RefreshToken = await IssueRefreshTokenAsync(user.Id),
                OnboardingCompleted = user.GoalType != null
            };
        }

        public async Task<AuthResult> RegisterAsync(RegisterDto dto)
        {
            bool emailTake = await _database.Users.AnyAsync(u => u.Email == dto.Email);
            if (emailTake)
            {
                return new AuthResult { Success = false, Error = "Email already in use" };
            }

            string hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            var user = new User
            {
                Email = dto.Email,
                PasswordHash = hash,
                Name = dto.Name
            };

            _database.Users.Add(user);
            await _database.SaveChangesAsync();

            return new AuthResult
            {
                Success = true,
                Token = _tokenService.GenerateAccessToken(user),
                RefreshToken = await IssueRefreshTokenAsync(user.Id),
                OnboardingCompleted = false
            };
        }

        public async Task<AuthResult> RefreshAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken))
                return new AuthResult { Success = false, Error = "Invalid refresh token" };

            var stored = await _database.RefreshTokens
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (stored == null || !stored.IsActive)
                return new AuthResult { Success = false, Error = "Invalid refresh token" };

            stored.RevokedAt = DateTime.UtcNow;
            await _database.SaveChangesAsync();

            return new AuthResult
            {
                Success = true,
                Token = _tokenService.GenerateAccessToken(stored.User),
                RefreshToken = await IssueRefreshTokenAsync(stored.UserId),
                OnboardingCompleted = stored.User.GoalType != null
            };
        }

        public async Task LogoutAsync(string refreshToken)
        {
            if (string.IsNullOrWhiteSpace(refreshToken)) return;

            var stored = await _database.RefreshTokens
                .FirstOrDefaultAsync(r => r.Token == refreshToken);

            if (stored != null && stored.RevokedAt == null)
            {
                stored.RevokedAt = DateTime.UtcNow;
                await _database.SaveChangesAsync();
            }
        }
    }
}
