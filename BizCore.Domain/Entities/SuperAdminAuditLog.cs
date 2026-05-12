namespace BizCore.Domain.Entities;

public class SuperAdminAuditLog : BaseEntity
{
    public Guid ActorUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string TargetType { get; set; } = string.Empty;
    public Guid? TargetId { get; set; }
    public string Details { get; set; } = string.Empty;
    public DateTime PerformedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser? ActorUser { get; set; }
}
