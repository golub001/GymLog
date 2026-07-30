using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public interface IWorkoutService
    {
        public Task<int> InsertNewWorkout(List<WorkoutSetDto> sets, int userId, DateOnly date, string notes = "", int? planDayId = null);
        public Task<List<ExerciseSearchItemDto>> SearchExercises(String pattern,String musclegroup,string equipment);
        public Task<ExerciseDetailDto?> GetExerciseById(int id, int? userId = null);
        public Task<List<DateOnly>> SearchActiveDays(int userId, int year, int month);
        public Task<List<WorkoutDetailDto>> GetWorkoutsByDate(int userId, DateOnly date);
        public Task<WorkoutDetailDto?> GetLastWorkoutByPlanDay(int userId, int planDayId);
        public Task<List<MuscleStatDto>> GetWeeklyMuscleStats(int userId);
        public Task<int> GetStreak(int userId);
        public Task<List<PersonalBestDto>> GetPersonalBests(int userId);
    }
}
