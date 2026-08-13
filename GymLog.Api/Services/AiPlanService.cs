using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using GymLog.Api.Data;
using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Services
{
    public class AiPlanService : IAiPlanService
    {
        private readonly AppDbContext _db;
        private readonly HttpClient _http;
        private readonly IConfiguration _config;
        private readonly ILogger<AiPlanService> _logger;

        public AiPlanService(AppDbContext db, HttpClient http, IConfiguration config,
            ILogger<AiPlanService> logger)
        {
            _db = db;
            _http = http;
            _config = config;
            _logger = logger;
        }

        public async Task<int?> GeneratePlan(int userId, string prompt, List<string> equipment, int? days)
        {
            var apiKey = _config["Ai:ApiKey"];
            var baseUrl = _config["Ai:BaseUrl"];
            var model = _config["Ai:Model"];
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("Ai:ApiKey is not configured - plan generation skipped.");
                return null;
            }

            var q = _db.Exercises.AsQueryable();
            if (equipment != null && equipment.Count > 0)
                q = q.Where(e => equipment.Contains(e.Equipment!));

            var raw = await q
                .Select(e => new { e.Id, e.Name, e.MuscleGroup, e.Equipment })
                .ToListAsync();

            var catalog = raw
                .GroupBy(e => e.MuscleGroup)
                .SelectMany(g => g.OrderBy(e => e.Name).Take(15))
                .ToList();

            if (catalog.Count == 0) return null;

            var validIds = catalog.Select(e => e.Id).ToHashSet();
            var listText = string.Join("\n", catalog.Select(e =>
                $"{e.Id} | {e.Name} | {e.MuscleGroup} | {e.Equipment}"));

            var dayHint = days.HasValue ? $"Make exactly {days.Value} training days. " : "";
            var system =
                "You are a professional fitness coach. Generate a workout plan from the user's request.\n" +
                "STRICT RULES:\n" +
                "- Use ONLY exercises from the EXERCISE LIST below, by their exact id.\n" +
                "- Never invent ids that are not in the list.\n" +
                "- Respect injuries/preferences (e.g. knee pain -> avoid deep squats, prefer leg press).\n" +
                "- targetSets 2-5, targetReps 5-15. Each day 4-6 exercises.\n" +
                dayHint +
                "- Respond with ONLY valid JSON, no markdown, no extra text.\n\n" +
                "JSON SCHEMA:\n" +
                "{\"name\":\"string\",\"description\":\"string\",\"days\":[{\"name\":\"string\",\"exercises\":[{\"exerciseId\":number,\"targetSets\":number,\"targetReps\":number}]}]}\n\n" +
                "EXERCISE LIST (id | name | muscle | equipment):\n" + listText;

            var payload = new
            {
                model,
                temperature = 0.3,
                response_format = new { type = "json_object" },
                messages = new object[]
                {
                    new { role = "system", content = system },
                    new { role = "user", content = prompt }
                }
            };

            string? content;
            try
            {
                var req = new HttpRequestMessage(HttpMethod.Post, $"{baseUrl}/chat/completions");
                req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                req.Content = JsonContent.Create(payload);

                var resp = await _http.SendAsync(req);
                if (!resp.IsSuccessStatusCode)
                {
                    // Without the body there is no way to tell a bad key from a retired
                    // service from a rate limit - they all surface as one generic failure.
                    var err = await resp.Content.ReadAsStringAsync();
                    _logger.LogWarning("AI provider returned {Status} for model {Model}: {Body}",
                        (int)resp.StatusCode, model, err.Length > 400 ? err[..400] : err);
                    return null;
                }

                var doc = await resp.Content.ReadFromJsonAsync<JsonElement>();
                content = doc.GetProperty("choices")[0]
                    .GetProperty("message").GetProperty("content").GetString();
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "AI request to {BaseUrl} failed", baseUrl);
                return null;
            }

            if (string.IsNullOrWhiteSpace(content))
            {
                _logger.LogWarning("AI returned an empty response.");
                return null;
            }

            var aiPlan = ParsePlan(content);
            if (aiPlan?.Days == null || aiPlan.Days.Count == 0) return null;

            var builtDays = new List<PlanDay>();
            foreach (var d in aiPlan.Days.Take(6))
            {
                var exercises = (d.Exercises ?? new())
                    .Where(e => validIds.Contains(e.ExerciseId))
                    .Select((e, j) => new PlanExercise
                    {
                        ExerciseId = e.ExerciseId,
                        TargetSets = Math.Clamp(e.TargetSets, 1, 6),
                        TargetReps = Math.Clamp(e.TargetReps, 1, 30),
                        Order = j
                    })
                    .ToList();

                if (exercises.Count == 0) continue;
                builtDays.Add(new PlanDay
                {
                    Name = string.IsNullOrWhiteSpace(d.Name) ? $"Day {builtDays.Count + 1}" : d.Name!,
                    Exercises = exercises
                });
            }

            if (builtDays.Count == 0) return null;

            var weekdays = Weekdays(builtDays.Count);
            for (int i = 0; i < builtDays.Count; i++)
            {
                builtDays[i].DayOfWeek = weekdays[i];
                builtDays[i].Order = weekdays[i];
            }

            var plan = new Plan
            {
                UserId = userId,
                Name = string.IsNullOrWhiteSpace(aiPlan.Name) ? "AI Plan" : aiPlan.Name!,
                Description = aiPlan.Description,
                Source = PlanSource.AI,
                Days = builtDays
            };

            await _db.Plans.AddAsync(plan);
            await _db.SaveChangesAsync();
            return plan.Id;
        }

        private static int[] Weekdays(int n) => n switch
        {
            1 => new[] { 1 },
            2 => new[] { 1, 4 },
            3 => new[] { 1, 3, 5 },
            4 => new[] { 1, 2, 4, 5 },
            5 => new[] { 1, 2, 3, 4, 5 },
            _ => new[] { 1, 2, 3, 4, 5, 6 },
        };

        private static AiPlanJson? ParsePlan(string content)
        {

            var text = content.Trim();
            if (text.StartsWith("```"))
            {
                int first = text.IndexOf('{');
                int last = text.LastIndexOf('}');
                if (first >= 0 && last > first) text = text.Substring(first, last - first + 1);
            }

            try
            {
                return JsonSerializer.Deserialize<AiPlanJson>(text, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                return null;
            }
        }

        private class AiPlanJson
        {
            public string? Name { get; set; }
            public string? Description { get; set; }
            public List<AiDayJson>? Days { get; set; }
        }

        private class AiDayJson
        {
            public string? Name { get; set; }
            public List<AiExJson>? Exercises { get; set; }
        }

        private class AiExJson
        {
            public int ExerciseId { get; set; }
            public int TargetSets { get; set; }
            public int TargetReps { get; set; }
        }
    }
}
