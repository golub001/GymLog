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

        public async Task<int> InsertNewWorkout(List<WorkoutSetDto> sets,int userId, DateOnly date,string notes = "")
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
                Date=date
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

        public async Task<List<ExerciseSearchItemDto>> SearchExercises(string pattern)
        {
            return await _database.Exercises.Where(u=>u.Name.Contains(pattern)).Take(20).Select(e => new ExerciseSearchItemDto
            {
                Id = e.Id,
                Name = e.Name,
                MuscleGroup = e.MuscleGroup.ToString(),
                Equipment = e.Equipment,
                ImageUrl = e.ImageUrl
            }).ToListAsync();
        }
    }
}
