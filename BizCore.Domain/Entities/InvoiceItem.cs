namespace BizCore.Domain.Entities;

public class InvoiceItem : BaseEntity
{
    public Guid InvoiceId { get; set; }
    public Guid? ProductId { get; set; }
    public Product? Product { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public DiscountType DiscountType { get; set; } = DiscountType.None;
    public decimal DiscountValue { get; set; }
    public decimal LineSubtotal { get; set; }
    public decimal LineDiscountAmount { get; set; }
    public decimal LineTotal { get; set; }

    public Invoice Invoice { get; set; } = null!;
}
