namespace BizCore.Application.DTOs.Inventory;

public class CreateDamagedGoodsDto
{
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public int Quantity { get; set; }
    public decimal EstimatedLoss { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string DamageType { get; set; } = string.Empty;
    public DateTime ReportedDate { get; set; }
    public string? Notes { get; set; }
}

public class DamagedGoodsDto
{
    public Guid Id { get; set; }
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal EstimatedLoss { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string DamageType { get; set; } = string.Empty;
    public DateTime ReportedDate { get; set; }
    public string ReportedBy { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DamagedGoodsSummaryDto
{
    public decimal TotalLossThisMonth { get; set; }
    public int PendingCount { get; set; }
    public int WrittenOffCount { get; set; }
    public string? MostAffectedProduct { get; set; }
}
