namespace BizCore.Application.DTOs.Inventory;

public class DemandForecastDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public decimal AvgWeeklySales { get; set; }
    public int CurrentStock { get; set; }
    public decimal WeeksRemaining { get; set; }
    public int ReorderSuggested { get; set; }
    public decimal Variance { get; set; }
    public string RiskLevel { get; set; } = string.Empty; // Critical, Low, Medium, Healthy
}
