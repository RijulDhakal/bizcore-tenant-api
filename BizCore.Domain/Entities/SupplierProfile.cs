using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class SupplierProfile : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid ContactId { get; set; }
    public string? SupplierCode { get; set; }
    public VATCategory VATCategory { get; set; } = VATCategory.Unregistered;
    public bool TDSApplicable { get; set; } = false;
    public decimal TDSRate { get; set; } = 1.5m;
    public string? PreferredPaymentMethod { get; set; }
    public string? Notes { get; set; }

    public Contact Contact { get; set; } = null!;
}