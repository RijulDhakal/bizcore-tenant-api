using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class KhataEntry : TenantEntity
{
    public Guid PartyId { get; set; }
    public EntryType Type { get; set; }
    public string TransactionType { get; set; } = "Cash Receipt";
    public string PaymentMode { get; set; } = "Cash";
    public string? ReferenceNumber { get; set; }
    public decimal Amount { get; set; }
    public decimal RunningBalance { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;

    public Party Party { get; set; } = null!;
}
