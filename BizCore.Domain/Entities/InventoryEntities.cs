using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class Category : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ParentCategoryId { get; set; }
    public Category? ParentCategory { get; set; }
    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class Product : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? CategoryId { get; set; }
    public Category? Category { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public bool IsVatApplicable { get; set; } = true;
    public string? Brand { get; set; }
    public int ReorderQuantity { get; set; } = 0;
    public bool TrackExpiry { get; set; } = false;
    public string? HSNCode { get; set; }
    public int LowStockThreshold { get; set; } = 10;
    public string Unit { get; set; } = "pcs";
    public string? Barcode { get; set; }
    public bool IsActive { get; set; } = true;
    public int CurrentStock { get; set; } = 0;
    public ICollection<Batch> Batches { get; set; } = new List<Batch>();
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<WarehouseStock> WarehouseStocks { get; set; } = new List<WarehouseStock>();
}

public class Warehouse : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Location { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? ContactPerson { get; set; }
    public string? ContactPhone { get; set; }
    public WarehouseType Type { get; set; } = WarehouseType.Godown;
    public WarehouseStatus Status { get; set; } = WarehouseStatus.Operational;
    public bool AllowNegativeStock { get; set; } = false;
    public bool IsDefault { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
    public ICollection<WarehouseStock> WarehouseStocks { get; set; } = new List<WarehouseStock>();
}

public class WarehouseStock : TenantEntity
{
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid? BatchId { get; set; }
    public Batch? Batch { get; set; }
    public int CurrentStock { get; set; }
    public int ReservedStock { get; set; }
}

public class Batch : TenantEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ManufactureDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public int InitialQuantity { get; set; }
    public int CurrentQuantity { get; set; }
    public decimal UnitCost { get; set; }
    public string? Location { get; set; }
    public BatchStatus Status { get; set; } = BatchStatus.Active;
    public string? Notes { get; set; }
}

public class StockTransfer : TenantEntity
{
    public Guid FromWarehouseId { get; set; }
    public Warehouse FromWarehouse { get; set; } = null!;
    public Guid ToWarehouseId { get; set; }
    public Warehouse ToWarehouse { get; set; } = null!;
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid? BatchId { get; set; }
    public Batch? Batch { get; set; } = null!;
    public int Quantity { get; set; }
    public TransferStatus Status { get; set; } = TransferStatus.Pending;
    public string? Notes { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime TransferredAt { get; set; } = DateTime.UtcNow;
    public TransferType Type { get; set; } = TransferType.Internal;
    public TransferPriority Priority { get; set; } = TransferPriority.Normal;
    public DateTime? ExpectedDeliveryDate { get; set; }
    public TransferReason? Reason { get; set; }
    public decimal? ShippingCost { get; set; }
    public string? TrackingNumber { get; set; }
    public bool RequiresApproval { get; set; }
}

public enum TransferStatus
{
    Pending,
    Approved,
    InTransit,
    Completed,
    Cancelled
}

public class StockMovement : TenantEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid? BatchId { get; set; }
    public Batch? Batch { get; set; }
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public StockMovementType Type { get; set; }
    public int Quantity { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? Note { get; set; }
    public DateTime MovedAt { get; set; } = DateTime.UtcNow;
}
