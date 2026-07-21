using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GymLog.Api.Models;

[Table("Friendships")]
public class Friendship
{
    [Key]
    public int Id { get; set; }

    [Required]
    public int RequesterId { get; set; }

    public User Requester { get; set; } = null!;

    [Required]
    public int AddresseeId { get; set; }

    public User Addressee { get; set; } = null!;

    [Required]
    public FriendshipStatus Status { get; set; } = FriendshipStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
