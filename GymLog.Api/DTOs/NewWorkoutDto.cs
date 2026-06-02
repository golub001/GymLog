using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class NewWorkoutDto: IValidatableObject
    {
        [Required]
        [MinLength(1)]
        public List<WorkoutSetDto> WorkoutSets { get; set; }
        public string? Notes { get; set; }

        public DateOnly Date {  get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            var today = DateOnly.FromDateTime(DateTime.UtcNow);

            if (Date == default)
                yield return new ValidationResult("Date is required.", new[] { nameof(Date) });
            else if (Date > today)
                yield return new ValidationResult("Date cannot be in the future.", new[] { nameof(Date) });
            else if (Date < today.AddDays(-7))
                yield return new ValidationResult("Date cannot be older than 7 days.", new[] { nameof(Date) });
        }
    }
}
