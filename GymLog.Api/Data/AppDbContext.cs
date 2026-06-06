using GymLog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace GymLog.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Exercise> Exercises { get; set; }
        public DbSet<Workout> Workouts { get; set; }
        public DbSet<WorkoutSet> WorkoutSets { get; set; }
        public DbSet<BodyWeight> BodyWeights { get; set; }
        public DbSet<Food> Foods { get; set; }
        public DbSet<DiaryEntry> DiaryEntries { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .Property(u => u.Sex)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<User>()
                .Property(u => u.ActivityLevel)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<User>()
                .Property(u => u.GoalType)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Exercise>()
                .Property(e => e.MuscleGroup)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<DiaryEntry>()
                .Property(e => e.MealType)
                .HasConversion<string>()
                .HasMaxLength(20);
        }
    }
}
