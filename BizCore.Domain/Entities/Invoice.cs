using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public enum DiscountType
{
    None,
    Percent,
    Fixed
}

public class Invoice : TenantEntity
{
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string? BillTo { get; set; }
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; } = InvoiceStatus.Draft;
    public string PaymentTerms { get; set; } = "Immediate";
    public string? BuyerPAN { get; set; }
    public string? BankDetails { get; set; }
    public string? TermsAndConditions { get; set; }
    public string? AmountInWords { get; set; }
    public bool IsTaxInvoice { get; set; } = true;
    public bool ApplyVat { get; set; } = false;

    // Line totals (before invoice discount)
    public decimal SubTotal { get; set; }
    public decimal DiscountTotal { get; set; }

    // Invoice-level discount
    public DiscountType DiscountType { get; set; } = DiscountType.None;
    public decimal DiscountValue { get; set; }

    // Tax and grand total
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public InvoiceType InvoiceType { get; set; } = InvoiceType.Retail;
    public Guid? MerchantId { get; set; }
    public Guid? DeliveryPartnerId { get; set; }
    public decimal CommissionRate { get; set; } = 0;
    public decimal CommissionAmount { get; set; } = 0;
    public decimal NetPayable { get; set; }
    public decimal DeliveryFee { get; set; } = 0;
    public string? DeliveryAddress { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Notes { get; set; }

    public Contact Customer { get; set; } = null!;
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
}
