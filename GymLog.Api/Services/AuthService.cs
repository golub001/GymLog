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

        public AuthService(AppDbContext database, ITokenService token)
        {
            _database = database;
            _tokenService = token;
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
            return new AuthResult { Success = true, Token = _tokenService.GenerateAccessToken(user), OnboardingCompleted = user.GoalType != null };
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

            return new AuthResult { Success = true, Token = _tokenService.GenerateAccessToken(user),OnboardingCompleted=false };
        }

    }
}
