using GymLog.Api.DTOs;

namespace GymLog.Api.Services
{
    public interface IPlanService
    {
        Task<List<PlanListItemDto>> GetTemplates();
        Task<List<PlanListItemDto>> GetMyPlans(int userId);
        Task<PlanDetailDto?> GetPlanById(int userId, int planId);
        Task<PlanDetailDto?> GetActivePlan(int userId);
        Task<int?> UseTemplate(int userId, int templateId);
        Task<bool> ActivatePlan(int userId, int planId);
        Task<bool> DeletePlan(int userId, int planId);
        Task<int?> AddExerciseToDay(int userId, int planDayId, int exerciseId, int targetSets, int targetReps);
        Task<bool> RemovePlanExercise(int userId, int planExerciseId);
        Task<bool> UpdatePlanExercise(int userId, int planExerciseId, int targetSets, int targetReps);
    }
}
