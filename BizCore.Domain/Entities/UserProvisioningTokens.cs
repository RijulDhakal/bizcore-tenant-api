using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class UserInvite : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }

    // One-time token is stored as a hash only (never store raw token)
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }

    public Guid CreatedByUserId { get; set; }
}

public class PasswordResetToken : BaseEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public DateTime? UsedAt { get; set; }
}
