using System.ComponentModel.DataAnnotations;

namespace GymLog.Api.DTOs
{
    public class PushTokenDto
    {
        [Required]
        [MaxLength(100)]
        public string Token { get; set; } = "";
    }
}
