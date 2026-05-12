using BizCore.Domain.Entities;

namespace BizCore.Domain.Entities;

public class ExpiryAlert : TenantEntity
{
    public Guid BatchId { get; set; }
    public Batch Batch { get; set; } = null!;
    
    public int DaysUntilExpiry { get; set; }
    public string Severity { get; set; } = "INFO";
    public string Message { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public bool IsDismissed { get; set; }
    public DateTime AlertDate { get; set; } = DateTime.UtcNow;
}