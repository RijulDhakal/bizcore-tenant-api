using BizCore.Application.DTOs.Report;
using BizCore.Application.Interfaces;
using BizCore.Shared.Constants;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims; // Added this using directive for ClaimTypes

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "SuperAdmin,Admin,Owner,Accountant")] // Modified this line
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService) => _reportService = reportService;

    private Guid TenantId => Guid.TryParse(User.FindFirst("tid")?.Value, out var tid) ? tid : Guid.Empty;

    [HttpGet("sales-summary")]
    public async Task<ActionResult<ApiResponse<SalesSummaryDto>>> GetSalesSummary(
        [FromQuery] DateTime? dateFrom = null,
        [FromQuery] DateTime? dateTo = null)
    {
        var result = await _reportService.GetSalesSummaryAsync(dateFrom, dateTo);
        return Ok(result);
    }

    [HttpGet("profit-loss")]
    public async Task<ActionResult<ApiResponse<ProfitLossDto>>> GetProfitLoss(
        [FromQuery] int? month,
        [FromQuery] int? year)
    {
        var m = month ?? DateTime.UtcNow.Month;
        var y = year ?? DateTime.UtcNow.Year;
        var result = await _reportService.GetProfitLossAsync(m, y, TenantId);
        return Ok(result);
    }

    [HttpGet("outstanding")]
    public async Task<ActionResult<ApiResponse<List<OutstandingInvoiceDto>>>> GetOutstanding()
    {
        var result = await _reportService.GetOutstandingAsync(TenantId);
        return Ok(result);
    }

    [HttpGet("vat-report")]
    public async Task<IActionResult> GetVatReport([FromQuery] int month, [FromQuery] int year)
    {
        var result = await _reportService.GetVatReportAsync(month, year);
        return Ok(new ApiResponse<VatReportDto> { Success = true, Data = result });
    }

    [HttpGet("inventory-valuation")]
    public async Task<IActionResult> GetInventoryValuation() => Ok(await _reportService.GetInventoryValuationAsync());

    [HttpGet("cash-flow")]
    public async Task<IActionResult> GetCashFlow([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo) 
        => Ok(await _reportService.GetCashFlowAsync(dateFrom, dateTo));
}
