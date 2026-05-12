namespace BizCore.Domain.Entities;

public class Branch : TenantEntity
{
    public Guid BusinessId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public bool IsMain { get; set; } = false;

    public Business Business { get; set; } = null!;
}
