using System.ComponentModel.DataAnnotations;
using GymLog.Api.Models;

namespace GymLog.Api.DTOs
{
    public class FoodSearchItemDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
        public decimal KcalPer100g { get; set; }
        public decimal ProteinPer100g { get; set; }
        public decimal CarbsPer100g { get; set; }
        public decimal FatPer100g { get; set; }
    }

    public class NewDiaryEntryDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int FoodId { get; set; }

        [Required]
        public DateOnly Date { get; set; }

        [Required]
        public MealType MealType { get; set; }

        [Required]
        [Range(1, 5000)]
        public decimal Grams { get; set; }
    }

    public class DiaryEntryDto
    {
        public int Id { get; set; }
        public int FoodId { get; set; }
        public string FoodName { get; set; } = "";
        public string MealType { get; set; } = "";
        public decimal Grams { get; set; }
        public decimal Kcal { get; set; }
        public decimal Protein { get; set; }
        public decimal Carbs { get; set; }
        public decimal Fat { get; set; }
    }

    public class NutritionSummaryDto
    {
        public int Days { get; set; }
        public int LoggedDays { get; set; }
        public decimal AvgKcal { get; set; }
        public decimal AvgProtein { get; set; }
        public decimal AvgCarbs { get; set; }
        public decimal AvgFat { get; set; }
    }

    public class DiaryDayDto
    {
        public DateOnly Date { get; set; }
        public decimal TotalKcal { get; set; }
        public decimal TotalProtein { get; set; }
        public decimal TotalCarbs { get; set; }
        public decimal TotalFat { get; set; }
        public List<DiaryEntryDto> Entries { get; set; } = new();
    }
}
