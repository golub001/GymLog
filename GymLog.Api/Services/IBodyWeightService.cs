using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface IBodyWeightService
    {
        Task<int> InsertWeight(int userId, DateOnly date, decimal weightKg);
        Task<List<WeightEntryDto>> GetWeights(int userId);
    }
}
