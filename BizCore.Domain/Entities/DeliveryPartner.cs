namespace BizCore.Domain.Entities;

public class DeliveryPartner : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string? ContactPhone { get; set; }
    public decimal DefaultDeliveryFee { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}
