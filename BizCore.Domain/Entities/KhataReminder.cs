namespace BizCore.Domain.Entities;

public class KhataReminder : TenantEntity
{
    public Guid PartyId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
    public bool IsSent { get; set; } = false;

    public Party Party { get; set; } = null!;
}
