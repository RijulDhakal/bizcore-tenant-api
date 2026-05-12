using BizCore.Domain.Entities;

namespace BizCore.Domain.Entities
{
public class Expense : TenantEntity
{
    public string Title { get; set; }
    public string Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string PaymentMode { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    
    public Guid? VendorId { get; set; }
    public Contact? Vendor { get; set; }
    public string? VendorName { get; set; }
    
    public bool IsRecurring { get; set; } = false;
    public bool IsRecurringTemplate { get; set; } = false;
    public string? RecurringFrequency { get; set; }
    public DateTime? NextDueDate { get; set; }
    public DateTime? LastGeneratedDate { get; set; }
    
    public bool IsBillable { get; set; } = false;
    public Guid? BillableToCustomerId { get; set; }
    public Guid? InvoiceId { get; set; }
}
}
