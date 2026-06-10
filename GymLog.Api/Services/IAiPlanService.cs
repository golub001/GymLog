namespace GymLog.Api.Services
{
    public interface IAiPlanService
    {

        Task<int?> GeneratePlan(int userId, string prompt, List<string> equipment, int? days);
    }
}
