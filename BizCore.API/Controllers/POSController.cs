using BizCore.API.Middleware;
using BizCore.Application.DTOs.POS;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using QuestPDF;

namespace BizCore.API.Controllers;

[Authorize(Roles = "SuperAdmin,Admin,Owner,Sales,POSOperator,Accountant")]
[RequireModule("pos")]
[ApiController]
[Route("api/[controller]")]
public class POSController : ControllerBase
{
    private readonly IPOSService _posService;

    public POSController(IPOSService posService)
    {
        _posService = posService;
    }

    [HttpPost("sessions/open")]
    public async Task<IActionResult> OpenSession(OpenSessionDto dto) => Ok(await _posService.OpenSessionAsync(dto));

    [HttpPut("sessions/{id}/close")]
    public async Task<IActionResult> CloseSession(Guid id, CloseSessionDto dto) => Ok(await _posService.CloseSessionAsync(id, dto));

    [HttpGet("sessions/current")]
    public async Task<IActionResult> GetCurrentSession() => Ok(await _posService.GetCurrentSessionAsync());

    [HttpGet("sessions/{id}/summary")]
    public async Task<IActionResult> GetSessionSummary(Guid id) => Ok(await _posService.GetSessionSummaryAsync(id));

    [HttpPost("transactions")]
    public async Task<IActionResult> CreateTransaction(CreatePOSTransactionDto dto) => Ok(await _posService.CreateTransactionAsync(dto));

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions(Guid? sessionId, DateTime? dateFrom, DateTime? dateTo) 
        => Ok(await _posService.GetTransactionsAsync(sessionId, dateFrom, dateTo));

    [HttpGet("transactions/{id}")]
    public async Task<IActionResult> GetTransaction(Guid id) => Ok(await _posService.GetTransactionByIdAsync(id));

    [HttpPut("transactions/{id}/refund")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner,Sales")]
    public async Task<IActionResult> RefundTransaction(Guid id) => Ok(await _posService.RefundTransactionAsync(id));

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts() => Ok(await _posService.GetPOSProductsAsync());

    [HttpGet("products/search")]
    public async Task<IActionResult> SearchProducts(string q) => Ok(await _posService.SearchPOSProductsAsync(q));

    [HttpGet("analytics/daily")]
    public async Task<IActionResult> GetDailyAnalytics(DateTime date) => Ok(await _posService.GetDailyAnalyticsAsync(date));

    [HttpGet("analytics/summary")]
    public async Task<IActionResult> GetSummaryAnalytics(DateTime dateFrom, DateTime dateTo) => Ok(await _posService.GetSummaryAnalyticsAsync(dateFrom, dateTo));

    [HttpPost("orders/hold")]
    public async Task<IActionResult> HoldOrder(CreatePOSTransactionDto dto) => Ok(await _posService.HoldOrderAsync(dto));

    [HttpGet("orders/held")]
    public async Task<IActionResult> GetHeldOrders() => Ok(await _posService.GetHeldOrdersAsync());

    [HttpPost("orders/{id}/recall")]
    public async Task<IActionResult> RecallOrder(Guid id) => Ok(await _posService.RecallHeldOrderAsync(id));

    [HttpGet("reports/z-report")]
    public async Task<IActionResult> GetZReport(DateTime date)
    {
        var result = await _posService.GenerateZReportAsync(date);
        return File(result.Data ?? Array.Empty<byte>(), "application/pdf", $"z-report-{date:yyyyMMdd}.pdf");
    }
}
