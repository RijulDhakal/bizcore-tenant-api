namespace BizCore.Domain.Entities;

public class DamagedGoods : TenantEntity
{
    public Guid ProductId { get; set; }
    public virtual Product Product { get; set; } = null!;
    public Guid WarehouseId { get; set; }
    public virtual Warehouse Warehouse { get; set; } = null!;
    public int Quantity { get; set; }
    public decimal EstimatedLoss { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string DamageType { get; set; } = string.Empty;
    public DateTime ReportedDate { get; set; }
    public string ReportedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DamagedGoodsStatus Status { get; set; } = DamagedGoodsStatus.Pending;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public enum DamagedGoodsStatus
{
    Pending = 0,
    Approved = 1,
    WrittenOff = 2,
    Rejected = 3,
}
