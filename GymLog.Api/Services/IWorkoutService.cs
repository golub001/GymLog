using GymLog.Api.DTOs;
using GymLog.Api.Models;

namespace GymLog.Api.Services
{
    public interface IWorkoutService
    {
        public Task<int> InsertNewWorkout(List<WorkoutSetDto> sets, int userId, DateOnly date, string notes = "");
        public Task<List<ExerciseSearchItemDto>> SearchExercises(String pattern);
        public Task<List<DateOnly>> SearchActiveDays(int userId, int year, int month);
        public Task<List<WorkoutDetailDto>> GetWorkoutsByDate(int userId, DateOnly date);
    }
}
