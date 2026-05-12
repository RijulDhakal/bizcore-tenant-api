namespace BizCore.Domain.Entities;

public class UserLoginHistory : BaseEntity
{
    public Guid? UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public bool IsSuccess { get; set; }
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? User { get; set; }
}
