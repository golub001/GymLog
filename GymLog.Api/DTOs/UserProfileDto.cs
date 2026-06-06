namespace GymLog.Api.DTOs
{
    public class UserProfileDto
    {
        public string Name { get; set; } = "";
        public int? DailyCalorieGoal { get; set; }
        public int? DailyProteinGoal { get; set; }
    }
}
