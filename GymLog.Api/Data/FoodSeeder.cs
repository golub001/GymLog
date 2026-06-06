using System.Text.Json;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Data;

public static class FoodSeeder
{
    public static async Task SeedFoodsAsync(AppDbContext db)
    {
        if (await db.Foods.AnyAsync()) return;

        var jsonPath = Path.Combine(AppContext.BaseDirectory, "Data", "foods.json");
        if (!File.Exists(jsonPath)) return;

        var json = await File.ReadAllTextAsync(jsonPath);
        var raw = JsonSerializer.Deserialize<List<FoodJson>>(json, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });
        if (raw == null) return;

        var foods = raw
            .Where(f => !string.IsNullOrWhiteSpace(f.Name))
            .Select(f => new Food
            {
                Name = f.Name,
                KcalPer100g = f.Kcal,
                ProteinPer100g = f.Protein,
                CarbsPer100g = f.Carbs,
                FatPer100g = f.Fat
            })
            .ToList();

        db.Foods.AddRange(foods);
        await db.SaveChangesAsync();
    }

    private class FoodJson
    {
        public string Name { get; set; } = "";
        public decimal Kcal { get; set; }
        public decimal Protein { get; set; }
        public decimal Carbs { get; set; }
        public decimal Fat { get; set; }
    }
}
