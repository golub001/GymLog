using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class GeneratePlanDto
    {
        [Required]
        [MaxLength(500)]
        public string Prompt { get; set; } = "";

        public List<string> Equipment { get; set; } = new();

        public int? Days { get; set; }
    }
}
