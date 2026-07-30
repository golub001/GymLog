using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class ChangePasswordDto
    {
        [Required]
        public string CurrentPassword { get; set; } = "";

        [Required]
        [MinLength(6)]
        [MaxLength(50)]
        public string NewPassword { get; set; } = "";
    }
}
