using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class ProgressPhotoService : IProgressPhotoService
    {
        private readonly AppDbContext _database;
        private readonly IWebHostEnvironment _env;

        private const string SubFolder = "uploads/progress";

        public ProgressPhotoService(AppDbContext database, IWebHostEnvironment env)
        {
            _database = database;
            _env = env;
        }

        private string WebRoot =>
            _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");

        public async Task<ProgressPhotoDto> Upload(int userId, IFormFile file, DateOnly takenAt, string? note)
        {
            var ext = Path.GetExtension(file.FileName);
            if (string.IsNullOrEmpty(ext)) ext = ".jpg";
            var fileName = $"{Guid.NewGuid():N}{ext}";

            var dir = Path.Combine(WebRoot, "uploads", "progress");
            Directory.CreateDirectory(dir);

            var fullPath = Path.Combine(dir, fileName);
            using (var fs = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(fs);
            }

            var entry = new ProgressPhoto
            {
                UserId = userId,
                FileName = fileName,
                TakenAt = takenAt,
                Note = note
            };

            await _database.ProgressPhotos.AddAsync(entry);
            await _database.SaveChangesAsync();

            return new ProgressPhotoDto
            {
                Id = entry.Id,
                ImageUrl = $"/{SubFolder}/{fileName}",
                TakenAt = entry.TakenAt,
                Note = entry.Note
            };
        }

        public async Task<List<ProgressPhotoDto>> GetAll(int userId)
        {
            return await _database.ProgressPhotos
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.TakenAt)
                .ThenByDescending(p => p.Id)
                .Select(p => new ProgressPhotoDto
                {
                    Id = p.Id,
                    ImageUrl = $"/{SubFolder}/{p.FileName}",
                    TakenAt = p.TakenAt,
                    Note = p.Note
                })
                .ToListAsync();
        }

        public async Task<bool> Delete(int userId, int id)
        {
            var entry = await _database.ProgressPhotos
                .FirstOrDefaultAsync(p => p.Id == id && p.UserId == userId);

            if (entry == null) return false;

            var fullPath = Path.Combine(WebRoot, "uploads", "progress", entry.FileName);
            if (File.Exists(fullPath))
            {
                try { File.Delete(fullPath); } catch { }
            }

            _database.ProgressPhotos.Remove(entry);
            await _database.SaveChangesAsync();
            return true;
        }
    }
}
