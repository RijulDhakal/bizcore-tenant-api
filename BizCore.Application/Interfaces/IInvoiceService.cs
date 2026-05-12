using BizCore.Application.DTOs.Invoice;
using BizCore.Shared.Wrappers;
using BizCore.Domain.Enums;

namespace BizCore.Application.Interfaces;

public interface IInvoiceService
{
    Task<ApiResponse<InvoiceDto>> CreateAsync(CreateInvoiceDto dto, Guid tenantId);
    Task<ApiResponse<List<InvoiceDto>>> GetAllAsync(InvoiceStatus? status, Guid? customerId, DateTime? dateFrom, DateTime? dateTo, Guid tenantId);
    Task<ApiResponse<InvoiceDto>> GetByIdAsync(Guid id, Guid tenantId);
    Task<ApiResponse<InvoiceDto>> UpdateAsync(Guid id, UpdateInvoiceDto dto, Guid tenantId);
    Task<ApiResponse<InvoiceDto>> MarkPaidAsync(Guid id, Guid tenantId);
    Task<ApiResponse<InvoiceDto>> ConfirmInvoiceAsync(Guid id, Guid tenantId, Guid warehouseId);
    Task<ApiResponse<byte[]>> GeneratePdfAsync(Guid id, Guid tenantId);
}
