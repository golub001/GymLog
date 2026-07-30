using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Data;

public static class PlanSeeder
{
    private record Ex(string Term, int Sets, int Reps);
    private record DayDef(string Name, Ex[] Exercises);

    private record PresetDef(string Name, string Description, (DayDef Day, int Dow)[] Days);

    private static readonly DayDef Push = new("Push", new[]
    {
        new Ex("barbell bench press", 4, 6),
        new Ex("barbell incline bench press", 3, 10),
        new Ex("barbell seated overhead press", 3, 10),
        new Ex("cable lateral raise", 3, 15),
        new Ex("tricep extension", 3, 12),
    });

    private static readonly DayDef Pull = new("Pull", new[]
    {
        new Ex("barbell deadlift", 3, 5),
        new Ex("barbell bent over row", 4, 8),
        new Ex("lat pulldown", 3, 10),
        new Ex("chin-up", 3, 8),
        new Ex("bicep curl", 3, 12),
    });

    private static readonly DayDef Legs = new("Legs", new[]
    {
        new Ex("barbell full squat", 4, 6),
        new Ex("barbell romanian deadlift", 3, 8),
        new Ex("leg extension", 3, 12),
        new Ex("dumbbell lunge", 3, 10),
        new Ex("barbell seated calf raise", 4, 15),
    });

    private static readonly DayDef UpperA = new("Upper A", new[]
    {
        new Ex("barbell bench press", 4, 6),
        new Ex("barbell bent over row", 4, 6),
        new Ex("barbell seated overhead press", 3, 10),
        new Ex("chin-up", 3, 8),
        new Ex("bicep curl", 3, 12),
    });

    private static readonly DayDef LowerA = new("Lower A", new[]
    {
        new Ex("barbell full squat", 4, 6),
        new Ex("barbell romanian deadlift", 3, 8),
        new Ex("leg extension", 3, 12),
        new Ex("barbell seated calf raise", 4, 15),
        new Ex("hanging leg raise", 3, 15),
    });

    private static readonly DayDef UpperB = new("Upper B", new[]
    {
        new Ex("barbell incline bench press", 4, 8),
        new Ex("lat pulldown", 4, 10),
        new Ex("dumbbell standing overhead press", 3, 10),
        new Ex("cable lateral raise", 3, 15),
        new Ex("tricep extension", 3, 12),
    });

    private static readonly DayDef LowerB = new("Lower B", new[]
    {
        new Ex("barbell deadlift", 4, 5),
        new Ex("dumbbell lunge", 3, 10),
        new Ex("leg extension", 3, 15),
        new Ex("dumbbell seated calf raise", 4, 15),
        new Ex("hanging leg raise", 3, 15),
    });

    private static readonly DayDef FullA = new("Full Body A", new[]
    {
        new Ex("barbell full squat", 3, 8),
        new Ex("barbell bench press", 3, 8),
        new Ex("barbell bent over row", 3, 8),
        new Ex("barbell seated overhead press", 3, 10),
        new Ex("hanging leg raise", 3, 12),
    });

    private static readonly DayDef FullB = new("Full Body B", new[]
    {
        new Ex("barbell deadlift", 3, 5),
        new Ex("dumbbell bench press", 3, 10),
        new Ex("lat pulldown", 3, 10),
        new Ex("dumbbell lunge", 3, 10),
        new Ex("front plank", 3, 12),
    });

    private static readonly DayDef FullC = new("Full Body C", new[]
    {
        new Ex("barbell full squat", 3, 8),
        new Ex("barbell incline bench press", 3, 8),
        new Ex("chin-up", 3, 8),
        new Ex("cable lateral raise", 3, 12),
        new Ex("hanging leg raise", 3, 12),
    });

    private static readonly DayDef BegA = new("Full Body A", new[]
    {
        new Ex("leg press", 3, 12),
        new Ex("dumbbell bench press", 3, 10),
        new Ex("lat pulldown", 3, 12),
        new Ex("dumbbell standing overhead press", 3, 10),
        new Ex("plank", 3, 30),
    });

    private static readonly DayDef BegB = new("Full Body B", new[]
    {
        new Ex("goblet squat", 3, 12),
        new Ex("barbell incline bench press", 3, 10),
        new Ex("chin-up", 3, 6),
        new Ex("cable lateral raise", 3, 12),
        new Ex("crunch", 3, 15),
    });

    private static readonly DayDef GluteA = new("Glutes & Legs A", new[]
    {
        new Ex("barbell full squat", 4, 10),
        new Ex("barbell romanian deadlift", 4, 10),
        new Ex("glute bridge", 3, 15),
        new Ex("dumbbell lunge", 3, 12),
        new Ex("barbell seated calf raise", 4, 15),
    });

    private static readonly DayDef UpperW = new("Upper Body", new[]
    {
        new Ex("lat pulldown", 3, 12),
        new Ex("dumbbell bench press", 3, 10),
        new Ex("dumbbell standing overhead press", 3, 12),
        new Ex("cable lateral raise", 3, 15),
        new Ex("bicep curl", 3, 12),
    });

    private static readonly DayDef GluteB = new("Glutes & Legs B", new[]
    {
        new Ex("leg press", 4, 12),
        new Ex("barbell romanian deadlift", 3, 10),
        new Ex("goblet squat", 3, 12),
        new Ex("glute bridge", 3, 15),
        new Ex("crunch", 3, 15),
    });

    private static readonly DayDef HomeA = new("Upper & Core", new[]
    {
        new Ex("push-up", 4, 12),
        new Ex("chin-up", 3, 8),
        new Ex("pull up", 3, 6),
        new Ex("plank", 3, 30),
        new Ex("mountain climber", 3, 20),
    });

    private static readonly DayDef HomeB = new("Lower & Cardio", new[]
    {
        new Ex("jump squat", 4, 15),
        new Ex("glute bridge", 3, 15),
        new Ex("skater hops", 3, 20),
        new Ex("high knee against wall", 3, 20),
        new Ex("jump rope", 3, 60),
    });

    private static readonly DayDef HomeC = new("Full Body & Cardio", new[]
    {
        new Ex("push-up", 3, 15),
        new Ex("burpee", 3, 12),
        new Ex("mountain climber", 3, 20),
        new Ex("jump squat", 3, 15),
        new Ex("hanging leg raise", 3, 15),
    });

    private static readonly DayDef StrengthA = new("Workout A", new[]
    {
        new Ex("barbell full squat", 5, 5),
        new Ex("barbell bench press", 5, 5),
        new Ex("barbell bent over row", 5, 5),
    });

    private static readonly DayDef StrengthB = new("Workout B", new[]
    {
        new Ex("barbell full squat", 5, 5),
        new Ex("barbell seated overhead press", 5, 5),
        new Ex("barbell deadlift", 1, 5),
    });

    private static readonly DayDef DumbA = new("Full Body A", new[]
    {
        new Ex("dumbbell goblet squat", 3, 12),
        new Ex("dumbbell bench press", 3, 10),
        new Ex("dumbbell bent over row", 3, 10),
        new Ex("dumbbell standing overhead press", 3, 10),
        new Ex("dumbbell romanian deadlift", 3, 12),
    });

    private static readonly DayDef DumbB = new("Full Body B", new[]
    {
        new Ex("dumbbell lunge", 3, 12),
        new Ex("dumbbell incline bench press", 3, 10),
        new Ex("dumbbell bent over row", 3, 10),
        new Ex("dumbbell standing overhead press", 3, 10),
        new Ex("dumbbell rear fly", 3, 15),
    });

    private static readonly PresetDef[] Presets =
    {
        new("Full Body", "3 days/week (Mon/Wed/Fri). Great for beginners and general fitness.",
            new[] { (FullA, 1), (FullB, 3), (FullC, 5) }),
        new("Push / Pull / Legs", "3 days/week (Mon/Wed/Fri). Balanced hypertrophy split.",
            new[] { (Push, 1), (Pull, 3), (Legs, 5) }),
        new("Upper / Lower", "4 days/week (Mon/Tue/Thu/Fri). Intermediate strength & size.",
            new[] { (UpperA, 1), (LowerA, 2), (UpperB, 4), (LowerB, 5) }),
        new("PPL ×2", "6 days/week (Mon–Sat). High volume for advanced lifters.",
            new[] { (Push, 1), (Pull, 2), (Legs, 3), (Push, 4), (Pull, 5), (Legs, 6) }),
        new("Beginner Full Body", "3 days/week (Mon/Wed/Fri). Simple, gentle routine for new lifters.",
            new[] { (BegA, 1), (BegB, 3), (BegA, 5) }),
        new("Glutes & Legs", "3 days/week (Mon/Wed/Fri). Lower-body & glute focus, plus upper and core.",
            new[] { (GluteA, 1), (UpperW, 3), (GluteB, 5) }),
        new("Home Bodyweight", "3 days/week (Mon/Wed/Fri). No equipment needed — bodyweight + cardio.",
            new[] { (HomeA, 1), (HomeB, 3), (HomeC, 5) }),
        new("Strength 5×5", "3 days/week (Mon/Wed/Fri). Heavy compound barbell lifts for raw strength.",
            new[] { (StrengthA, 1), (StrengthB, 3), (StrengthA, 5) }),
        new("Dumbbell Only", "3 days/week (Mon/Wed/Fri). Full-body routine using just a pair of dumbbells.",
            new[] { (DumbA, 1), (DumbB, 3), (DumbA, 5) }),
    };

    public static async Task SeedPlansAsync(AppDbContext db)
    {

        if (await db.Plans.AnyAsync(p => p.UserId == null)) return;

        var exercises = await db.Exercises
            .Select(e => new { e.Id, e.Name })
            .ToListAsync();
        if (exercises.Count == 0) return;

        int? Resolve(string term)
        {
            var t = term.ToLowerInvariant();
            var match = exercises
                .Where(e => e.Name.ToLowerInvariant().Contains(t))
                .OrderBy(e => e.Name.Length)
                .FirstOrDefault();
            return match?.Id;
        }

        var plans = new List<Plan>();
        foreach (var preset in Presets)
        {
            var plan = new Plan
            {
                UserId = null,
                Name = preset.Name,
                Description = preset.Description,
                Source = PlanSource.Preset,
                Days = new List<PlanDay>()
            };

            foreach (var (dayDef, dow) in preset.Days)
            {
                var day = new PlanDay
                {
                    Name = dayDef.Name,
                    DayOfWeek = dow,
                    Order = dow,
                    Exercises = new List<PlanExercise>()
                };

                int exOrder = 0;
                foreach (var ex in dayDef.Exercises)
                {
                    var exId = Resolve(ex.Term);
                    if (exId == null) continue;
                    day.Exercises.Add(new PlanExercise
                    {
                        ExerciseId = exId.Value,
                        TargetSets = ex.Sets,
                        TargetReps = ex.Reps,
                        Order = exOrder++
                    });
                }

                plan.Days.Add(day);
            }

            plans.Add(plan);
        }

        db.Plans.AddRange(plans);
        await db.SaveChangesAsync();
    }
}
