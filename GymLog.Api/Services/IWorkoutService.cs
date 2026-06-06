using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public interface IWorkoutService
    {
        public Task<int> InsertNewWorkout(List<WorkoutSetDto> sets, int userId, DateOnly date, string notes = "");
        public Task<List<ExerciseSearchItemDto>> SearchExercises(String pattern,String musclegroup,string equipment);
        public Task<ExerciseDetailDto?> GetExerciseById(int id);
        public Task<List<DateOnly>> SearchActiveDays(int userId, int year, int month);
        public Task<List<WorkoutDetailDto>> GetWorkoutsByDate(int userId, DateOnly date);
        public Task<List<MuscleStatDto>> GetWeeklyMuscleStats(int userId);
    }
}
