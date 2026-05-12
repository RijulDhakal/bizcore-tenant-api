using BizCore.Application.DTOs.Purchase;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IPurchaseService
{
    Task<ApiResponse<List<SupplierDto>>> GetSuppliersAsync(string? search, bool? isActive);
    Task<ApiResponse<SupplierDto>> GetSupplierByIdAsync(Guid id);
    Task<ApiResponse<SupplierDto>> CreateSupplierAsync(CreateSupplierDto dto);
    Task<ApiResponse<SupplierDto>> UpdateSupplierAsync(Guid id, UpdateSupplierDto dto);
    Task<ApiResponse<bool>> DeleteSupplierAsync(Guid id);
    Task<ApiResponse<decimal>> GetSupplierBalanceAsync(Guid supplierId);

    Task<ApiResponse<PurchaseOrderDto>> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto);
    Task<ApiResponse<List<PurchaseOrderDto>>> GetPurchaseOrdersAsync(string? status, Guid? supplierId, DateTime? dateFrom, DateTime? dateTo);
    Task<ApiResponse<PurchaseOrderDto>> GetPurchaseOrderByIdAsync(Guid id);
    Task<ApiResponse<bool>> UpdatePurchaseOrderAsync(Guid id, CreatePurchaseOrderDto dto);
    Task<ApiResponse<bool>> SubmitPurchaseOrderAsync(Guid id);
    Task<ApiResponse<bool>> ApprovePurchaseOrderAsync(Guid id, string? notes);
    Task<ApiResponse<bool>> ReceivePurchaseOrderAsync(Guid id);
    Task<ApiResponse<bool>> RejectPurchaseOrderAsync(Guid id, string notes);
    Task<ApiResponse<bool>> CancelPurchaseOrderAsync(Guid id);
    Task<ApiResponse<bool>> DeletePurchaseOrderAsync(Guid id);
    Task<ApiResponse<List<PurchaseOrderDto>>> GetPendingApprovalOrdersAsync();
    Task<ApiResponse<PurchaseAnalyticsDto>> GetPurchaseAnalyticsAsync();

    Task<ApiResponse<GoodsReceiptDto>> CreateGoodsReceiptAsync(CreateGoodsReceiptDto dto);
    Task<ApiResponse<List<GoodsReceiptDto>>> GetGoodsReceiptsAsync(Guid? orderId);
    Task<ApiResponse<GoodsReceiptDto>> GetGoodsReceiptByIdAsync(Guid id);

    Task<ApiResponse<PaymentDto>> CreatePaymentAsync(CreatePaymentDto dto);
    Task<ApiResponse<List<PaymentDto>>> GetPaymentsAsync(Guid? orderId);
    Task<ApiResponse<PaymentDto>> GetPaymentByIdAsync(Guid id);
    Task<ApiResponse<List<PaymentDto>>> GetPaymentsForOrderAsync(Guid orderId);

    Task<ApiResponse<PurchaseReturnDto>> CreatePurchaseReturnAsync(CreatePurchaseReturnDto dto);
    Task<ApiResponse<List<PurchaseReturnDto>>> GetPurchaseReturnsAsync(Guid? orderId);
    Task<ApiResponse<PurchaseReturnDto>> GetPurchaseReturnByIdAsync(Guid id);
    Task<ApiResponse<bool>> ApprovePurchaseReturnAsync(Guid id);
    Task<ApiResponse<bool>> RejectPurchaseReturnAsync(Guid id);

    Task<ApiResponse<PurchaseSummaryReportDto>> GetPurchaseSummaryAsync(DateTime fromDate, DateTime toDate);
    Task<ApiResponse<SupplierLedgerDto>> GetSupplierLedgerAsync(Guid supplierId, DateTime fromDate, DateTime toDate);
    Task<ApiResponse<TaxReportDto>> GetTaxReportAsync(DateTime fromDate, DateTime toDate);
}