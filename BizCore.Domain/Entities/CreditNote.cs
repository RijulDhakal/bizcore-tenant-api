using System.ComponentModel.DataAnnotations;

namespace BizCore.Domain.Entities;

public class CreditNote : TenantEntity
{
    [Required]
    public Guid InvoiceId { get; set; }

    [Required]
    [MaxLength(50)]
    public string CreditNoteNumber { get; set; } = string.Empty;

    public DateTime IssueDate { get; set; } = DateTime.UtcNow;

    [Required]
    public string Reason { get; set; } = string.Empty;

    public decimal Amount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Draft";

    public Invoice? Invoice { get; set; }
}
