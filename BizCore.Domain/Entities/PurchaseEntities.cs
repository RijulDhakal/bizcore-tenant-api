using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class PurchaseOrder : TenantEntity
{
    public string PONumber { get; set; } = string.Empty;
    public Guid SupplierId { get; set; }
    public Contact Supplier { get; set; } = null!;
    public PurchaseOrderStatus Status { get; set; } = PurchaseOrderStatus.Draft;
    public DateTime OrderDate { get; set; } = DateTime.UtcNow;
    public DateTime? ExpectedDelivery { get; set; }
    public string? ReferenceNumber { get; set; }
    public Guid? DeliveryWarehouseId { get; set; }
    public Warehouse? DeliveryWarehouse { get; set; }
    public string? DeliveryAddress { get; set; }
    public OrderType OrderType { get; set; } = OrderType.Regular;
    public Priority Priority { get; set; } = Priority.Normal;
    public Currency Currency { get; set; } = Currency.NPR;
    public PaymentType? PaymentType { get; set; }
    
    // New fields (Phase 2)
    public PaymentTerms PaymentTerms { get; set; } = PaymentTerms.COD;
    public ShippingMethod ShippingMethod { get; set; } = ShippingMethod.FOB;
    public DateTime? PromiseDate { get; set; }
    public string? SupplierReferenceNo { get; set; }
    
    public decimal? AdvanceAmount { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal SubTotal { get; set; }
    public decimal TaxRate { get; set; } = 13;
    public decimal TaxAmount { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? FreightCharges { get; set; }
    public decimal? ShippingCost { get; set; }  // Alias for FreightCharges (backward compat)
    public decimal? ExciseDuty { get; set; }
    public decimal? TDSAmount { get; set; }
    public decimal TaxableAmount { get; set; }
    public decimal GrandTotal { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal? ExchangeRate { get; set; } = 1;  // Alias for GrandTotal (backward compat)
    
    // Approval (Phase 2.3)
    public ApprovalStatus ApprovalStatus { get; set; } = ApprovalStatus.Pending;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public string? ApprovalNotes { get; set; }
    
    public Guid? ApprovalLevel1By { get; set; }
    public DateTime? ApprovalLevel1Date { get; set; }
    public string? ApprovalLevel1Notes { get; set; }
    public Guid? ApprovalLevel2By { get; set; }
    public DateTime? ApprovalLevel2Date { get; set; }
    public string? ApprovalLevel2Notes { get; set; }
    public string? Attachments { get; set; }
    public string? TermsAndConditions { get; set; }
    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }
    public ICollection<PurchaseOrderItem> Items { get; set; } = new List<PurchaseOrderItem>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public ICollection<GoodsReceipt> GoodsReceipts { get; set; } = new List<GoodsReceipt>();
}

public class PurchaseOrderItem : BaseEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal TaxRate { get; set; } = 13;
    public decimal TaxAmount { get; set; }
    public decimal? DiscountPercent { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal Amount { get; set; }
    public int QuantityReceived { get; set; }
    public decimal? UnitPriceLand { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public bool IsDeleted { get; set; }
}

public class GoodsReceipt : TenantEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public string ReceiptNumber { get; set; } = string.Empty;
    public DateTime ReceivedDate { get; set; } = DateTime.UtcNow;
    public Guid ReceivedBy { get; set; }
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public GoodsReceiptStatus Status { get; set; } = GoodsReceiptStatus.Pending;
    public GoodsReceiptCondition Condition { get; set; } = GoodsReceiptCondition.Good;
    public string? DamageDetails { get; set; }
    public string? Attachments { get; set; }
    public string? Notes { get; set; }
    public ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
}

public class GoodsReceiptItem : TenantEntity
{
    public Guid GoodsReceiptId { get; set; }
    public GoodsReceipt GoodsReceipt { get; set; } = null!;
    public Guid PurchaseOrderItemId { get; set; }
    public PurchaseOrderItem PurchaseOrderItem { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int QuantityOrdered { get; set; }
    public int QuantityReceived { get; set; }
    public int QuantityDamaged { get; set; }
    public string? BatchNumber { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? Notes { get; set; }
}

public class Payment : TenantEntity
{
    public string PaymentNumber { get; set; } = string.Empty;
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public DateTime PaymentDate { get; set; } = DateTime.UtcNow;
    public decimal Amount { get; set; }
    public PaymentRecordMethod PaymentMethod { get; set; } = PaymentRecordMethod.BankTransfer;
    public string? ReferenceNumber { get; set; }
    public Guid? BankAccountId { get; set; }
    public BankAccount? BankAccount { get; set; }
    public decimal? TDSDeducted { get; set; }
    public string? TDSCertificateNo { get; set; }
    public DateTime? TDSCertificateDate { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? Notes { get; set; }
    public Guid CreatedBy { get; set; }
}

public class PurchaseReturn : TenantEntity
{
    public Guid PurchaseOrderId { get; set; }
    public PurchaseOrder PurchaseOrder { get; set; } = null!;
    public Guid? GoodsReceiptId { get; set; }
    public GoodsReceipt? GoodsReceipt { get; set; }
    public string ReturnNumber { get; set; } = string.Empty;
    public DateTime ReturnDate { get; set; } = DateTime.UtcNow;
    public ReturnType ReturnType { get; set; }
    public Guid SupplierId { get; set; }
    public Contact Supplier { get; set; } = null!;
    public decimal TotalAmount { get; set; }
    public PurchaseReturnStatus Status { get; set; } = PurchaseReturnStatus.Pending;
    public RefundType RefundType { get; set; } = RefundType.CreditNote;
    public string Reason { get; set; } = string.Empty;
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedDate { get; set; }
    public string? Notes { get; set; }
    public ICollection<PurchaseReturnItem> Items { get; set; } = new List<PurchaseReturnItem>();
}

public class PurchaseReturnItem : BaseEntity
{
    public Guid PurchaseReturnId { get; set; }
    public PurchaseReturn PurchaseReturn { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal Amount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public ReturnCondition Condition { get; set; } = ReturnCondition.Unopened;
    public Resolution Resolution { get; set; } = Resolution.CreditNote;
}
