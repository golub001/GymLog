using GymLog.Api.Models;

namespace GymLog.Api.DTOs
{
    public class UserProfileDto
    {
        public string Name { get; set; } = "";
        public string? AvatarUrl { get; set; }
        public int? DailyCalorieGoal { get; set; }
        public int? DailyProteinGoal { get; set; }

        public Sex? Sex { get; set; }
        public DateOnly? BirthDate { get; set; }
        public int? HeightCm { get; set; }
        public ActivityLevel? ActivityLevel { get; set; }
        public GoalType? GoalType { get; set; }
        public decimal? LatestWeightKg { get; set; }
    }
}
