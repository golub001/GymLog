using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface IProgressPhotoService
    {
        public Task<ProgressPhotoDto> Upload(int userId, IFormFile file, DateOnly takenAt, string? note);
        public Task<List<ProgressPhotoDto>> GetAll(int userId);
        public Task<bool> Delete(int userId, int id);
        public Task<bool> HasPhotoOnDate(int userId, DateOnly date);
    }
}
