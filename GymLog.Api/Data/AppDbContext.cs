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
        public DbSet<Plan> Plans { get; set; }
        public DbSet<PlanDay> PlanDays { get; set; }
        public DbSet<PlanExercise> PlanExercises { get; set; }
        public DbSet<ProgressPhoto> ProgressPhotos { get; set; }
        public DbSet<Friendship> Friendships { get; set; }
        public DbSet<ScheduledSession> ScheduledSessions { get; set; }
        public DbSet<SessionParticipant> SessionParticipants { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<RefreshToken> RefreshTokens { get; set; }

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

            modelBuilder.Entity<Plan>()
                .Property(p => p.Source)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Plan>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<User>()
                .HasOne(u => u.ActivePlan)
                .WithMany()
                .HasForeignKey(u => u.ActivePlanId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Workout>()
                .HasOne(w => w.PlanDay)
                .WithMany()
                .HasForeignKey(w => w.PlanDayId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<ProgressPhoto>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Friendship>()
                .Property(f => f.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Requester)
                .WithMany()
                .HasForeignKey(f => f.RequesterId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Friendship>()
                .HasOne(f => f.Addressee)
                .WithMany()
                .HasForeignKey(f => f.AddresseeId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Friendship>()
                .HasIndex(f => new { f.RequesterId, f.AddresseeId })
                .IsUnique();

            modelBuilder.Entity<ScheduledSession>()
                .HasOne(s => s.Host)
                .WithMany()
                .HasForeignKey(s => s.HostId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SessionParticipant>()
                .Property(p => p.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            modelBuilder.Entity<SessionParticipant>()
                .HasOne(p => p.Session)
                .WithMany(s => s.Participants)
                .HasForeignKey(p => p.SessionId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SessionParticipant>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SessionParticipant>()
                .HasIndex(p => new { p.SessionId, p.UserId })
                .IsUnique();

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Sender)
                .WithMany()
                .HasForeignKey(m => m.SenderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasOne(m => m.Receiver)
                .WithMany()
                .HasForeignKey(m => m.ReceiverId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.SenderId, m.ReceiverId });

            modelBuilder.Entity<Message>()
                .HasIndex(m => new { m.ReceiverId, m.ReadAt });

            modelBuilder.Entity<RefreshToken>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<RefreshToken>()
                .HasIndex(r => r.Token)
                .IsUnique();
        }
    }
}
