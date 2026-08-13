using System.Text.Json;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Data;

public static class DataSeeder
{
    private const string GitHubBaseUrl =
        "https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/";

    public static async Task SeedExercisesAsync(AppDbContext db)
    {
        var jsonPath = Path.Combine(AppContext.BaseDirectory, "Data", "exercises.json");
        if (!File.Exists(jsonPath)) return;

        var json = await File.ReadAllTextAsync(jsonPath);
        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower,
            PropertyNameCaseInsensitive = true
        };

        var raw = JsonSerializer.Deserialize<List<ExerciseJson>>(json, options);
        if (raw == null) return;

        // Insert only what is missing, so the seeder can top up an existing database
        // without touching rows that workouts and plans already reference.
        var existingNames = await db.Exercises
            .Select(e => e.Name)
            .ToListAsync();
        var known = new HashSet<string>(existingNames, StringComparer.OrdinalIgnoreCase);

        var exercises = new List<Exercise>();
        foreach (var r in raw)
        {
            var muscle = MapMuscleGroup(r.BodyPart, r.MuscleGroup, r.Target);
            if (muscle == null) continue;

            var name = Capitalize(r.Name);
            if (!known.Add(name)) continue;

            string? instructions = null;
            if (r.InstructionSteps?.En != null && r.InstructionSteps.En.Count > 0)
            {
                instructions = string.Join(
                    "\n",
                    r.InstructionSteps.En.Select((s, i) => $"{i + 1}. {s}"));
            }

            exercises.Add(new Exercise
            {
                Name = name,
                MuscleGroup = muscle.Value,
                Equipment = !string.IsNullOrWhiteSpace(r.Equipment)
                    ? Capitalize(r.Equipment)
                    : null,
                Instructions = instructions,
                ImageUrl = !string.IsNullOrWhiteSpace(r.Image)
                    ? GitHubBaseUrl + r.Image
                    : null,
                GifUrl = !string.IsNullOrWhiteSpace(r.GifUrl)
                    ? GitHubBaseUrl + r.GifUrl
                    : null
            });
        }

        db.Exercises.AddRange(exercises);
        await db.SaveChangesAsync();
    }

    private static MuscleGroup? MapMuscleGroup(string? bodyPart, string? muscleGroup, string? target)
    {
        var bp = bodyPart?.ToLowerInvariant() ?? "";
        var mg = muscleGroup?.ToLowerInvariant() ?? "";
        var tg = target?.ToLowerInvariant() ?? "";

        return bp switch
        {
            "chest" => MuscleGroup.Chest,
            "back" => MuscleGroup.Back,
            "shoulders" => MuscleGroup.Shoulders,
            "waist" => MuscleGroup.Core,
            "upper legs" => MuscleGroup.Legs,
            "lower legs" => MuscleGroup.Legs,
            // The dataset's muscle_group column is unreliable for arms — it holds
            // values like "forearms" or "chest" and never names the actual muscle —
            // so target is the authoritative field here.
            "upper arms" => $"{tg} {mg}".Contains("triceps") ? MuscleGroup.Triceps
                : $"{tg} {mg}".Contains("biceps") ? MuscleGroup.Biceps
                : (MuscleGroup?)null,
            "lower arms" => MuscleGroup.Biceps,
            _ => null
        };
    }

    private static string Capitalize(string s)
    {
        if (string.IsNullOrEmpty(s)) return s;
        return char.ToUpper(s[0]) + s.Substring(1);
    }

    private class ExerciseJson
    {
        public string Id { get; set; } = "";
        public string Name { get; set; } = "";
        public string BodyPart { get; set; } = "";
        public string Equipment { get; set; } = "";
        public InstructionStepsJson? InstructionSteps { get; set; }
        public string MuscleGroup { get; set; } = "";
        public string Target { get; set; } = "";
        public string Image { get; set; } = "";
        public string GifUrl { get; set; } = "";
    }

    private class InstructionStepsJson
    {
        public List<string>? En { get; set; }
    }
}
