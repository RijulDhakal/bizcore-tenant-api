using BizCore.Domain.Entities;
using BizCore.Domain.Enums;

namespace BizCore.Application.DTOs.Invoice;

public class InvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? BillTo { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public InvoiceStatus Status { get; set; }
    public string PaymentTerms { get; set; } = "Immediate";
    public string? BuyerPAN { get; set; }
    public string? BankDetails { get; set; }
    public string? TermsAndConditions { get; set; }
    public string? AmountInWords { get; set; }
    public bool IsTaxInvoice { get; set; } = true;
    public bool ApplyVat { get; set; } = false;
    public decimal SubTotal { get; set; }
    public decimal DiscountTotal { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public InvoiceType InvoiceType { get; set; }
    public Guid? MerchantId { get; set; }
    public Guid? DeliveryPartnerId { get; set; }
    public decimal CommissionRate { get; set; }
    public decimal CommissionAmount { get; set; }
    public decimal NetPayable { get; set; }
    public decimal DeliveryFee { get; set; }
    public string? DeliveryAddress { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Notes { get; set; }
    public List<InvoiceItemDto> Items { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class InvoiceItemDto
{
    public Guid Id { get; set; }
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public decimal LineSubtotal { get; set; }
    public decimal LineDiscountAmount { get; set; }
    public decimal LineTotal { get; set; }
}

public class CreateInvoiceDto
{
    public Guid CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public string? BillTo { get; set; }
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public DateTime DueDate { get; set; }
    public string? PaymentTerms { get; set; }
    public string? BuyerPAN { get; set; }
    public string? BankDetails { get; set; }
    public string? TermsAndConditions { get; set; }
    public bool IsTaxInvoice { get; set; } = true;
    public bool ApplyVat { get; set; } = false;
    public DiscountType DiscountType { get; set; } = DiscountType.None;
    public decimal DiscountValue { get; set; }
    public int InvoiceType { get; set; } = 0;
    public Guid? MerchantId { get; set; }
    public Guid? DeliveryPartnerId { get; set; }
    public decimal CommissionRate { get; set; } = 0;
    public decimal DeliveryFee { get; set; } = 0;
    public string? DeliveryAddress { get; set; }
    public DateTime? ExpectedDeliveryDate { get; set; }
    public string? Notes { get; set; }
    public List<CreateInvoiceItemDto> Items { get; set; } = new();
}

public class CreateInvoiceItemDto
{
    public Guid? ProductId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.None;
    public decimal DiscountValue { get; set; }
}

public class UpdateInvoiceDto
{
    public Guid CustomerId { get; set; }
    public string? BillTo { get; set; }
    public DateTime IssueDate { get; set; }
    public DateTime DueDate { get; set; }
    public string? PaymentTerms { get; set; }
    public string? BuyerPAN { get; set; }
    public string? BankDetails { get; set; }
    public string? TermsAndConditions { get; set; }
    public bool IsTaxInvoice { get; set; } = true;
    public bool ApplyVat { get; set; } = false;
    public decimal TaxAmount { get; set; }
    public string? Notes { get; set; }
    public List<CreateInvoiceItemDto> Items { get; set; } = new();
}
