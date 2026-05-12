using BizCore.Application.DTOs.POS;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IPOSService
{
    // Sessions
    Task<ApiResponse<POSSessionDto>> OpenSessionAsync(OpenSessionDto dto);
    Task<ApiResponse<bool>> CloseSessionAsync(Guid id, CloseSessionDto dto);
    Task<ApiResponse<POSSessionDto>> GetCurrentSessionAsync();
    Task<ApiResponse<POSSessionDto>> GetSessionSummaryAsync(Guid id);

    // Transactions
    Task<ApiResponse<POSTransactionDto>> CreateTransactionAsync(CreatePOSTransactionDto dto);
    Task<ApiResponse<List<POSTransactionDto>>> GetTransactionsAsync(Guid? sessionId, DateTime? dateFrom, DateTime? dateTo);
    Task<ApiResponse<POSTransactionDto>> GetTransactionByIdAsync(Guid id);
    Task<ApiResponse<bool>> RefundTransactionAsync(Guid id);

    // Products
    Task<ApiResponse<List<POSProductDto>>> GetPOSProductsAsync();
    Task<ApiResponse<List<POSProductDto>>> SearchPOSProductsAsync(string q);

    // Analytics
    Task<ApiResponse<DailyPOSAnalyticsDto>> GetDailyAnalyticsAsync(DateTime date);
    Task<ApiResponse<DailyPOSAnalyticsDto>> GetSummaryAnalyticsAsync(DateTime dateFrom, DateTime dateTo);

    // Hold Orders
    Task<ApiResponse<bool>> HoldOrderAsync(CreatePOSTransactionDto dto);
    Task<ApiResponse<List<POSTransactionDto>>> GetHeldOrdersAsync();
    Task<ApiResponse<POSTransactionDto>> RecallHeldOrderAsync(Guid id);

    // Z-Report
    Task<ApiResponse<byte[]>> GenerateZReportAsync(DateTime date);
}
