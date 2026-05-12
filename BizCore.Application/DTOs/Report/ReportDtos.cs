namespace BizCore.Application.DTOs.Report;

public class SalesSummaryDto
{
    public decimal TotalSales { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalInvoices { get; set; }
    public int InvoiceCount { get; set; }
    public decimal AverageInvoiceValue { get; set; }
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public List<DailySalesDto> DailySales { get; set; } = new();
}

public class DailySalesDto
{
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public int Count { get; set; }
}

public class ProfitLossDto
{
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetProfit { get; set; }
    public decimal ProfitRatio { get; set; }
    public decimal InvoiceIncome { get; set; }
    public decimal POSIncome { get; set; }
    public List<IncomeItemDto> IncomeItems { get; set; } = new();
}

public class IncomeItemDto
{
    public string Label { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class OutstandingInvoiceDto
{
    public Guid CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public int InvoiceCount { get; set; }
    public decimal TotalOutstanding { get; set; }
    public List<OutstandingItemDto> Invoices { get; set; } = new();
}

public class OutstandingItemDto
{
    public Guid InvoiceId { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime DueDate { get; set; }
    public int DaysOverdue { get; set; }
}

public class InventoryValuationDto
{
    public decimal TotalCostValue { get; set; }
    public decimal TotalRetailValue { get; set; }
    public int TotalItems { get; set; }
    public int TotalStock { get; set; }
    public List<InventoryValuationItemDto> Items { get; set; } = new();
}

public class InventoryValuationItemDto
{
    public Guid ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string SKU { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
    public decimal CostPrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal TotalValue { get; set; }
}

public class CashFlowDto
{
    public DateTime DateFrom { get; set; }
    public DateTime DateTo { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal TotalInflow { get; set; }
    public decimal TotalOutflow { get; set; }
    public decimal ClosingBalance { get; set; }
    public List<CashFlowItemDto> Transactions { get; set; } = new();
}

public class CashFlowItemDto
{
    public DateTime Date { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
