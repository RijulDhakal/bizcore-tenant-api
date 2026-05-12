using BizCore.API.Middleware;
using BizCore.Application.DTOs.Inventory;
using BizCore.Application.Interfaces;
using BizCore.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/inventory")]
[Authorize]
[RequireModule("inventory")]
public class DemandForecastController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public DemandForecastController(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    /// <summary>
    /// Demand Forecast — Bullwhip Effect analysis.
    /// Analyzes last 90 days of sales (POS + Invoice) to forecast demand.
    /// </summary>
    [HttpGet("demand-forecast")]
    public async Task<IActionResult> GetDemandForecast()
    {
        var tenantId = _tenantService.GetTenantId();
        var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);

        // Get all active products
        var products = await _context.Products
            .Where(p => p.IsActive && !p.IsDeleted)
            .ToListAsync();

        // Get current stock from WarehouseStocks
        var warehouseStocks = await _context.WarehouseStocks
            .Where(ws => ws.TenantId == tenantId)
            .GroupBy(ws => ws.ProductId)
            .Select(g => new { ProductId = g.Key, CurrentStock = g.Sum(ws => ws.CurrentStock) })
            .ToDictionaryAsync(x => x.ProductId, x => x.CurrentStock);

        // Get POS sales in last 90 days (by product)
        var posSales = await _context.POSTransactionItems
            .Include(ti => ti.Transaction)
            .Where(ti => !ti.IsDeleted
                && ti.Transaction.CompletedAt >= ninetyDaysAgo
                && ti.Transaction.Status == Domain.Enums.POSTransactionStatus.Completed)
            .GroupBy(ti => ti.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalQty = g.Sum(x => x.Quantity),
                // Get weekly breakdown for variance
                WeeklyData = g.Select(x => new { x.Quantity, x.Transaction.CompletedAt })
            })
            .ToListAsync();

        // Get Invoice item sales (using StockOut movements as proxy)
        var invoiceSales = await _context.StockMovements
            .Where(sm => !sm.IsDeleted
                && sm.Type == Domain.Enums.StockMovementType.StockOut
                && sm.MovedAt >= ninetyDaysAgo
                && sm.ReferenceType == "Invoice")
            .GroupBy(sm => sm.ProductId)
            .Select(g => new
            {
                ProductId = g.Key,
                TotalQty = g.Sum(x => x.Quantity)
            })
            .ToListAsync();

        var weeksInPeriod = 13m; // ~90 days
        var forecasts = new List<DemandForecastDto>();

        foreach (var product in products)
        {
            var currentStock = warehouseStocks.GetValueOrDefault(product.Id, 0);
            var posQty = posSales.FirstOrDefault(p => p.ProductId == product.Id)?.TotalQty ?? 0;
            var invoiceQty = invoiceSales.FirstOrDefault(p => p.ProductId == product.Id)?.TotalQty ?? 0;
            var totalSold = posQty + invoiceQty;

            if (totalSold == 0 && currentStock > 0)
            {
                forecasts.Add(new DemandForecastDto
                {
                    ProductId = product.Id,
                    ProductName = product.Name,
                    SKU = product.SKU,
                    AvgWeeklySales = 0,
                    CurrentStock = currentStock,
                    WeeksRemaining = 999,
                    ReorderSuggested = 0,
                    Variance = 0,
                    RiskLevel = "Healthy"
                });
                continue;
            }

            var avgWeekly = totalSold / weeksInPeriod;
            var weeksRemaining = avgWeekly > 0 ? currentStock / avgWeekly : 999m;

            // Calculate variance using weekly POS data
            var posProductData = posSales.FirstOrDefault(p => p.ProductId == product.Id);
            decimal variance = 0;
            if (posProductData != null)
            {
                var weeklyQuantities = new decimal[13];
                foreach (var sale in posProductData.WeeklyData)
                {
                    var weekIndex = (int)((DateTime.UtcNow - sale.CompletedAt).TotalDays / 7);
                    if (weekIndex >= 0 && weekIndex < 13)
                        weeklyQuantities[weekIndex] += sale.Quantity;
                }

                var mean = weeklyQuantities.Average();
                if (mean > 0)
                    variance = (decimal)weeklyQuantities.Select(w => Math.Pow((double)(w - mean), 2)).Average();
            }

            // Determine reorder suggestion
            var reorderSuggested = 0;
            if (weeksRemaining < 4)
            {
                reorderSuggested = (int)Math.Ceiling((double)(avgWeekly * 8)) - currentStock;
                if (reorderSuggested < 0) reorderSuggested = 0;
            }

            var riskLevel = weeksRemaining switch
            {
                <= 1 => "Critical",
                <= 3 => "Low",
                <= 6 => "Medium",
                _ => "Healthy"
            };

            forecasts.Add(new DemandForecastDto
            {
                ProductId = product.Id,
                ProductName = product.Name,
                SKU = product.SKU,
                AvgWeeklySales = Math.Round(avgWeekly, 2),
                CurrentStock = currentStock,
                WeeksRemaining = Math.Round(weeksRemaining, 1),
                ReorderSuggested = reorderSuggested,
                Variance = Math.Round(variance, 2),
                RiskLevel = riskLevel
            });
        }

        // Sort by risk (most critical first)
        var sorted = forecasts
            .OrderBy(f => f.RiskLevel switch
            {
                "Critical" => 0,
                "Low" => 1,
                "Medium" => 2,
                _ => 3
            })
            .ThenByDescending(f => f.AvgWeeklySales)
            .ToList();

        return Ok(new { success = true, data = sorted });
    }
}
