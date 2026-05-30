namespace GymLog.Api.DTOs
{
    public class PlanOptionDto
    {
        public string Label { get; set; } = "";
        public double WeeklyChangeKg { get; set; }
        public int Calories { get; set; }
    }
}
