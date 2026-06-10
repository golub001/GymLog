using GymLog.Api.Data;
using GymLog.Api.DTOs;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class WorkoutService : IWorkoutService
    {
        private readonly AppDbContext _database;
        public WorkoutService(AppDbContext database)
        {
            _database = database;
        }

        public async Task<int> InsertNewWorkout(List<WorkoutSetDto> sets,int userId, DateOnly date,string notes = "", int? planDayId = null)
        {

            List<WorkoutSet> array = sets.GroupBy(s => s.ExerciseId)
                .SelectMany(group => group.Select((set, Index) =>
                new WorkoutSet{
                    ExerciseId = set.ExerciseId,
                    WeightKg = set.WeightKg,
                    Reps = set.Reps,
                    SetOrder = Index+1
                }))
                .ToList();
            Workout workout = new Workout{
                Notes = notes,
                Sets=array,
                UserId = userId,
                Date=date,
                PlanDayId = planDayId
            };

            await _database.Workouts.AddAsync(workout);
            await _database.SaveChangesAsync();
            return workout.Id;
        }

        public async Task<List<DateOnly>> SearchActiveDays(int userId, int year, int month)
        {
            return await _database.Workouts
                .Where(w => w.UserId == userId && w.Date.Year == year && w.Date.Month == month)
                .Select(w => w.Date)
                .Distinct()
                .ToListAsync();
        }

        public async Task<List<WorkoutDetailDto>> GetWorkoutsByDate(int userId, DateOnly date)
        {
            var workouts = await _database.Workouts
                .Where(w => w.UserId == userId && w.Date == date)
                .Include(w => w.Sets)
                    .ThenInclude(s => s.Exercise)
                .OrderBy(w => w.CreatedAt)
                .ToListAsync();

            return workouts.Select(w => new WorkoutDetailDto
            {
                Id = w.Id,
                Date = w.Date,
                Notes = w.Notes,
                Exercises = w.Sets
                    .GroupBy(s => s.ExerciseId)
                    .Select(g => new ExerciseBlockDto
                    {
                        ExerciseId = g.Key,
                        ExerciseName = g.First().Exercise.Name,
                        MuscleGroup = g.First().Exercise.MuscleGroup.ToString(),
                        Sets = g.OrderBy(s => s.SetOrder)
                            .Select(s => new SetDto
                            {
                                SetOrder = s.SetOrder,
                                WeightKg = s.WeightKg,
                                Reps = s.Reps
                            })
                            .ToList()
                    })
                    .ToList()
            }).ToList();
        }

        public async Task<List<ExerciseSearchItemDto>> SearchExercises(string pattern,string muscleGroup,string equpment)
        {
            MuscleGroup? mg=null;

            if (!string.IsNullOrEmpty(muscleGroup) && Enum.TryParse<MuscleGroup>(muscleGroup,true,out var parsed))
            {
                mg = parsed;
            }
            return await _database.Exercises.Where(u =>
                    (string.IsNullOrEmpty(pattern) || u.Name.Contains(pattern)) &&
                    (mg == null || u.MuscleGroup == mg) &&
                    (string.IsNullOrEmpty(equpment) || u.Equipment == equpment)
                )
                .OrderBy(u=>u.Name)
                .Take(20).Select(e => new ExerciseSearchItemDto
            {
                Id = e.Id,
                Name = e.Name,
                MuscleGroup = e.MuscleGroup.ToString(),
                Equipment = e.Equipment,
                ImageUrl = e.ImageUrl
            }).ToListAsync();
        }

        public async Task<ExerciseDetailDto?> GetExerciseById(int id)
        {
            return await _database.Exercises
                .Where(e => e.Id == id)
                .Select(e => new ExerciseDetailDto
                {
                    Id = e.Id,
                    Name = e.Name,
                    MuscleGroup = e.MuscleGroup.ToString(),
                    Equipment = e.Equipment,
                    Instructions = e.Instructions,
                    ImageUrl = e.ImageUrl,
                    GifUrl = e.GifUrl
                })
                .FirstOrDefaultAsync();
        }

        public async Task<List<MuscleStatDto>> GetWeeklyMuscleStats(int userId)
        {

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            int daysSinceMonday = ((int)today.DayOfWeek + 6) % 7;
            var since = today.AddDays(-daysSinceMonday);

            var done = await _database.WorkoutSets
                .Where(s => s.Workout.UserId == userId && s.Workout.Date >= since)
                .GroupBy(s => s.Exercise.MuscleGroup)
                .Select(g => new { Muscle = g.Key, Count = g.Count() })
                .ToListAsync();

            var activePlanId = await _database.Users
                .Where(u => u.Id == userId)
                .Select(u => u.ActivePlanId)
                .FirstOrDefaultAsync();

            var targets = activePlanId == null
                ? new List<(MuscleGroup Muscle, int Target)>()
                : (await _database.PlanExercises
                    .Where(pe => pe.PlanDay.PlanId == activePlanId)
                    .GroupBy(pe => pe.Exercise.MuscleGroup)
                    .Select(g => new { Muscle = g.Key, Target = g.Sum(x => x.TargetSets) })
                    .ToListAsync())
                    .Select(x => (x.Muscle, x.Target))
                    .ToList();

            var muscles = done.Select(d => d.Muscle)
                .Union(targets.Select(t => t.Muscle))
                .Distinct();

            return muscles.Select(m => new MuscleStatDto
            {
                MuscleGroup = m.ToString(),
                SetCount = done.FirstOrDefault(d => d.Muscle == m)?.Count ?? 0,
                TargetSets = targets.FirstOrDefault(t => t.Muscle == m).Target
            }).ToList();
        }
    }
}
