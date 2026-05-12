namespace BizCore.Domain.Entities;

public class Merchant : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public decimal DefaultCommissionRate { get; set; } = 0;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}
