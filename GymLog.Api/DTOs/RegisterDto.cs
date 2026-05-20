using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class RegisterDto
    {
        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        [Required]
        [EmailAddress]
        [MaxLength(50)]
        public string Email { get; set; }= string.Empty;
        [Required]
        [MinLength(6)]
        [MaxLength(50)]
        public string Password { get; set; }=string.Empty;
        
    }
}
