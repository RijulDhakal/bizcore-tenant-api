using BizCore.Application.DTOs.Report;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IReportService
{
    Task<ApiResponse<SalesSummaryDto>> GetSalesSummaryAsync(DateTime? dateFrom = null, DateTime? dateTo = null);
    Task<ApiResponse<ProfitLossDto>> GetProfitLossAsync(int month, int year, Guid tenantId);
    Task<ApiResponse<List<OutstandingInvoiceDto>>> GetOutstandingAsync(Guid tenantId);
    Task<VatReportDto> GetVatReportAsync(int month, int year);
    Task<ApiResponse<InventoryValuationDto>> GetInventoryValuationAsync();
    Task<ApiResponse<CashFlowDto>> GetCashFlowAsync(DateTime? dateFrom, DateTime? dateTo);
}
