using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class POSSession : TenantEntity
{
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public Guid OpenedBy { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal OpeningCash { get; set; }
    public decimal? ClosingCash { get; set; }
    public POSSessionStatus Status { get; set; }
    public decimal TotalSales { get; set; }
    public int TotalTransactions { get; set; }
}

public class POSTransaction : TenantEntity
{
    public Guid SessionId { get; set; }
    public POSSession Session { get; set; } = null!;
    public string TransactionNumber { get; set; } = string.Empty;
    public Guid? CustomerId { get; set; }
    public Contact? Customer { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
    public decimal SubTotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal Change { get; set; }
    public POSTransactionStatus Status { get; set; }
    public DateTime CompletedAt { get; set; }
    public ICollection<POSTransactionItem> Items { get; set; } = new List<POSTransactionItem>();
}

public class POSTransactionItem : BaseEntity
{
    public Guid TransactionId { get; set; }
    public POSTransaction Transaction { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string ProductName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal Amount { get; set; }
}
