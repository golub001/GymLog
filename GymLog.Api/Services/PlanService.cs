using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class PlanService : IPlanService
    {
        private readonly AppDbContext _database;
        public PlanService(AppDbContext database)
        {
            _database = database;
        }

        public async Task<List<PlanListItemDto>> GetTemplates()
        {
            return await _database.Plans
                .Where(p => p.UserId == null)
                .OrderBy(p => p.Id)
                .Select(p => new PlanListItemDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Source = p.Source.ToString(),
                    DayCount = p.Days.Count,
                    IsActive = false,
                    IsTemplate = true
                })
                .ToListAsync();
        }

        public async Task<List<PlanListItemDto>> GetMyPlans(int userId)
        {
            var activeId = await _database.Users
                .Where(u => u.Id == userId)
                .Select(u => u.ActivePlanId)
                .FirstOrDefaultAsync();

            return await _database.Plans
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PlanListItemDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Source = p.Source.ToString(),
                    DayCount = p.Days.Count,
                    IsActive = p.Id == activeId,
                    IsTemplate = false
                })
                .ToListAsync();
        }

        public async Task<PlanDetailDto?> GetPlanById(int userId, int planId)
        {
            var plan = await _database.Plans
                .Where(p => p.Id == planId && (p.UserId == userId || p.UserId == null))
                .Include(p => p.Days.OrderBy(d => d.DayOfWeek))
                    .ThenInclude(d => d.Exercises.OrderBy(e => e.Order))
                        .ThenInclude(pe => pe.Exercise)
                .FirstOrDefaultAsync();

            if (plan == null) return null;

            var activeId = await _database.Users
                .Where(u => u.Id == userId)
                .Select(u => u.ActivePlanId)
                .FirstOrDefaultAsync();

            return new PlanDetailDto
            {
                Id = plan.Id,
                Name = plan.Name,
                Description = plan.Description,
                Source = plan.Source.ToString(),
                IsActive = plan.Id == activeId,
                IsTemplate = plan.UserId == null,
                Days = plan.Days.Select(d => new PlanDayDto
                {
                    Id = d.Id,
                    Name = d.Name,
                    DayOfWeek = d.DayOfWeek,
                    Order = d.Order,
                    Exercises = d.Exercises.Select(pe => new PlanExerciseDto
                    {
                        Id = pe.Id,
                        ExerciseId = pe.ExerciseId,
                        ExerciseName = pe.Exercise.Name,
                        MuscleGroup = pe.Exercise.MuscleGroup.ToString(),
                        Equipment = pe.Exercise.Equipment,
                        ImageUrl = pe.Exercise.ImageUrl,
                        TargetSets = pe.TargetSets,
                        TargetReps = pe.TargetReps,
                        Order = pe.Order
                    }).ToList()
                }).ToList()
            };
        }

        public async Task<PlanDetailDto?> GetActivePlan(int userId)
        {
            var activeId = await _database.Users
                .Where(u => u.Id == userId)
                .Select(u => u.ActivePlanId)
                .FirstOrDefaultAsync();

            if (activeId == null) return null;
            return await GetPlanById(userId, activeId.Value);
        }

        public async Task<int?> UseTemplate(int userId, int templateId)
        {
            var template = await _database.Plans
                .Where(p => p.Id == templateId && p.UserId == null)
                .Include(p => p.Days)
                    .ThenInclude(d => d.Exercises)
                .FirstOrDefaultAsync();

            if (template == null) return null;

            var copy = new Plan
            {
                UserId = userId,
                Name = template.Name,
                Description = template.Description,
                Source = template.Source,
                Days = template.Days
                    .OrderBy(d => d.DayOfWeek)
                    .Select(d => new PlanDay
                    {
                        Name = d.Name,
                        DayOfWeek = d.DayOfWeek,
                        Order = d.Order,
                        Exercises = d.Exercises
                            .OrderBy(e => e.Order)
                            .Select(pe => new PlanExercise
                            {
                                ExerciseId = pe.ExerciseId,
                                TargetSets = pe.TargetSets,
                                TargetReps = pe.TargetReps,
                                Order = pe.Order
                            }).ToList()
                    }).ToList()
            };

            await _database.Plans.AddAsync(copy);
            await _database.SaveChangesAsync();

            var user = await _database.Users.FindAsync(userId);
            if (user != null)
            {
                user.ActivePlanId = copy.Id;
                await _database.SaveChangesAsync();
            }

            return copy.Id;
        }

        public async Task<bool> ActivatePlan(int userId, int planId)
        {
            var owns = await _database.Plans
                .AnyAsync(p => p.Id == planId && p.UserId == userId);
            if (!owns) return false;

            var user = await _database.Users.FindAsync(userId);
            if (user == null) return false;

            user.ActivePlanId = planId;
            await _database.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePlan(int userId, int planId)
        {
            var plan = await _database.Plans
                .FirstOrDefaultAsync(p => p.Id == planId && p.UserId == userId);
            if (plan == null) return false;

            _database.Plans.Remove(plan);
            await _database.SaveChangesAsync();
            return true;
        }

        public async Task<int?> AddExerciseToDay(int userId, int planDayId, int exerciseId, int targetSets, int targetReps)
        {

            var day = await _database.PlanDays
                .Include(d => d.Plan)
                .FirstOrDefaultAsync(d => d.Id == planDayId && d.Plan.UserId == userId);
            if (day == null) return null;

            var exists = await _database.Exercises.AnyAsync(e => e.Id == exerciseId);
            if (!exists) return null;

            var nextOrder = await _database.PlanExercises
                .Where(pe => pe.PlanDayId == planDayId)
                .Select(pe => (int?)pe.Order)
                .MaxAsync() ?? -1;

            var entry = new PlanExercise
            {
                PlanDayId = planDayId,
                ExerciseId = exerciseId,
                TargetSets = Math.Clamp(targetSets, 1, 10),
                TargetReps = Math.Clamp(targetReps, 1, 100),
                Order = nextOrder + 1
            };

            await _database.PlanExercises.AddAsync(entry);
            await _database.SaveChangesAsync();
            return entry.Id;
        }

        public async Task<bool> RemovePlanExercise(int userId, int planExerciseId)
        {
            var entry = await _database.PlanExercises
                .Include(pe => pe.PlanDay).ThenInclude(d => d.Plan)
                .FirstOrDefaultAsync(pe => pe.Id == planExerciseId && pe.PlanDay.Plan.UserId == userId);
            if (entry == null) return false;

            _database.PlanExercises.Remove(entry);
            await _database.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdatePlanExercise(int userId, int planExerciseId, int targetSets, int targetReps)
        {
            var entry = await _database.PlanExercises
                .Include(pe => pe.PlanDay).ThenInclude(d => d.Plan)
                .FirstOrDefaultAsync(pe => pe.Id == planExerciseId && pe.PlanDay.Plan.UserId == userId);
            if (entry == null) return false;

            entry.TargetSets = Math.Clamp(targetSets, 1, 10);
            entry.TargetReps = Math.Clamp(targetReps, 1, 100);
            await _database.SaveChangesAsync();
            return true;
        }
    }
}
