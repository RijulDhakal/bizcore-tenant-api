using BizCore.API.Middleware;
using BizCore.Application.DTOs.Purchase;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[Authorize]
[RequireModule("purchase")]
[ApiController]
[Route("api/[controller]")]
public class PurchaseController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;

    public PurchaseController(IPurchaseService purchaseService)
    {
        _purchaseService = purchaseService;
    }

    [HttpGet("suppliers")]
    public async Task<IActionResult> GetSuppliers(string? search, bool? isActive) 
        => Ok(await _purchaseService.GetSuppliersAsync(search, isActive));

    [HttpGet("suppliers/{id}")]
    public async Task<IActionResult> GetSupplier(Guid id) => Ok(await _purchaseService.GetSupplierByIdAsync(id));

    [HttpPost("suppliers")]
    public async Task<IActionResult> CreateSupplier(CreateSupplierDto dto) => Ok(await _purchaseService.CreateSupplierAsync(dto));

    [HttpPut("suppliers/{id}")]
    public async Task<IActionResult> UpdateSupplier(Guid id, UpdateSupplierDto dto) => Ok(await _purchaseService.UpdateSupplierAsync(id, dto));

    [HttpDelete("suppliers/{id}")]
    public async Task<IActionResult> DeleteSupplier(Guid id) => Ok(await _purchaseService.DeleteSupplierAsync(id));

    [HttpGet("suppliers/{id}/balance")]
    public async Task<IActionResult> GetSupplierBalance(Guid id) => Ok(await _purchaseService.GetSupplierBalanceAsync(id));

    [HttpPost("orders")]
    public async Task<IActionResult> CreateOrder(CreatePurchaseOrderDto dto) => Ok(await _purchaseService.CreatePurchaseOrderAsync(dto));

    [HttpGet("orders")]
    public async Task<IActionResult> GetOrders(string? status, Guid? supplierId, DateTime? dateFrom, DateTime? dateTo) 
        => Ok(await _purchaseService.GetPurchaseOrdersAsync(status, supplierId, dateFrom, dateTo));

    [HttpGet("orders/{id}")]
    public async Task<IActionResult> GetOrder(Guid id) => Ok(await _purchaseService.GetPurchaseOrderByIdAsync(id));

    [HttpPut("orders/{id}")]
    public async Task<IActionResult> UpdateOrder(Guid id, CreatePurchaseOrderDto dto) => Ok(await _purchaseService.UpdatePurchaseOrderAsync(id, dto));

    [HttpPost("orders/{id}/submit")]
    public async Task<IActionResult> SubmitOrder(Guid id) => Ok(await _purchaseService.SubmitPurchaseOrderAsync(id));

    [HttpPost("orders/{id}/receive")]
    public async Task<IActionResult> ReceiveOrder(Guid id) => Ok(await _purchaseService.ReceivePurchaseOrderAsync(id));

    [HttpPost("orders/{id}/approve")]
    public async Task<IActionResult> ApproveOrder(Guid id, [FromBody] ApproveRejectNotesDto? body)
        => Ok(await _purchaseService.ApprovePurchaseOrderAsync(id, body?.Notes));

    [HttpPost("orders/{id}/reject")]
    public async Task<IActionResult> RejectOrder(Guid id, [FromBody] ApproveRejectNotesDto body)
        => Ok(await _purchaseService.RejectPurchaseOrderAsync(id, body.Notes));

    public sealed record ApproveRejectNotesDto(string Notes);

    [HttpPost("orders/{id}/cancel")]
    public async Task<IActionResult> CancelOrder(Guid id) => Ok(await _purchaseService.CancelPurchaseOrderAsync(id));

    [HttpDelete("orders/{id}")]
    public async Task<IActionResult> DeleteOrder(Guid id) => Ok(await _purchaseService.DeletePurchaseOrderAsync(id));

    [HttpGet("orders/pending-approval")]
    public async Task<IActionResult> GetPendingApprovalOrders() => Ok(await _purchaseService.GetPendingApprovalOrdersAsync());

    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics() => Ok(await _purchaseService.GetPurchaseAnalyticsAsync());

    [HttpPost("receipts")]
    public async Task<IActionResult> CreateReceipt(CreateGoodsReceiptDto dto) => Ok(await _purchaseService.CreateGoodsReceiptAsync(dto));

    [HttpGet("receipts")]
    public async Task<IActionResult> GetReceipts(Guid? orderId) => Ok(await _purchaseService.GetGoodsReceiptsAsync(orderId));

    [HttpGet("receipts/{id}")]
    public async Task<IActionResult> GetReceipt(Guid id) => Ok(await _purchaseService.GetGoodsReceiptByIdAsync(id));

    [HttpPost("payments")]
    public async Task<IActionResult> CreatePayment(CreatePaymentDto dto) => Ok(await _purchaseService.CreatePaymentAsync(dto));

    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments(Guid? orderId) => Ok(await _purchaseService.GetPaymentsAsync(orderId));

    [HttpGet("payments/{id}")]
    public async Task<IActionResult> GetPayment(Guid id) => Ok(await _purchaseService.GetPaymentByIdAsync(id));

    [HttpGet("orders/{id}/payments")]
    public async Task<IActionResult> GetOrderPayments(Guid id) => Ok(await _purchaseService.GetPaymentsForOrderAsync(id));

    [HttpPost("returns")]
    public async Task<IActionResult> CreateReturn(CreatePurchaseReturnDto dto) => Ok(await _purchaseService.CreatePurchaseReturnAsync(dto));

    [HttpGet("returns")]
    public async Task<IActionResult> GetReturns(Guid? orderId) => Ok(await _purchaseService.GetPurchaseReturnsAsync(orderId));

    [HttpGet("returns/{id}")]
    public async Task<IActionResult> GetReturn(Guid id) => Ok(await _purchaseService.GetPurchaseReturnByIdAsync(id));

    [HttpPost("returns/{id}/approve")]
    public async Task<IActionResult> ApproveReturn(Guid id) => Ok(await _purchaseService.ApprovePurchaseReturnAsync(id));

    [HttpPost("returns/{id}/reject")]
    public async Task<IActionResult> RejectReturn(Guid id) => Ok(await _purchaseService.RejectPurchaseReturnAsync(id));

    [HttpGet("reports/summary")]
    public async Task<IActionResult> GetPurchaseSummary(DateTime fromDate, DateTime toDate) => Ok(await _purchaseService.GetPurchaseSummaryAsync(fromDate, toDate));

    [HttpGet("reports/supplier-ledger")]
    public async Task<IActionResult> GetSupplierLedger(Guid supplierId, DateTime fromDate, DateTime toDate) => Ok(await _purchaseService.GetSupplierLedgerAsync(supplierId, fromDate, toDate));

    [HttpGet("reports/tax")]
    public async Task<IActionResult> GetTaxReport(DateTime fromDate, DateTime toDate) => Ok(await _purchaseService.GetTaxReportAsync(fromDate, toDate));
}
