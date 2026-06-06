using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class BodyWeightService : IBodyWeightService
    {
        private readonly AppDbContext _database;
        public BodyWeightService(AppDbContext database)
        {
            _database = database;
        }

        public async Task<int> InsertWeight(int userId, DateOnly date, decimal weightKg)
        {
            BodyWeight entry = new BodyWeight
            {
                UserId = userId,
                Date = date,
                WeightKg = weightKg
            };

            await _database.BodyWeights.AddAsync(entry);
            await _database.SaveChangesAsync();
            return entry.Id;
        }

        public async Task<List<WeightEntryDto>> GetWeights(int userId)
        {
            return await _database.BodyWeights
                .Where(w => w.UserId == userId)
                .OrderBy(w => w.Date)
                .Select(w => new WeightEntryDto
                {
                    Date = w.Date,
                    WeightKg = w.WeightKg
                })
                .ToListAsync();
        }
    }
}
