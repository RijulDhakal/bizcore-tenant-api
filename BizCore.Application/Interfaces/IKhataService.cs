using BizCore.Application.DTOs.Khata;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IKhataService
{
    Task<ApiResponse<KhataEntryDto>> CreateEntryAsync(CreateKhataEntryDto dto, Guid tenantId);
    Task<ApiResponse<List<KhataEntryDto>>> GetEntriesAsync(Guid? partyId, DateTime? dateFrom, DateTime? dateTo, Guid tenantId);
    Task<ApiResponse<PartyBalanceDto>> GetPartyBalanceAsync(Guid partyId, Guid tenantId);
    Task<ApiResponse<List<PartyDto>>> GetPartiesAsync(Guid tenantId);
    Task<ApiResponse<PartyDto>> CreatePartyAsync(CreatePartyDto dto, Guid tenantId);
    Task<ApiResponse> CreateReminderAsync(CreateReminderDto dto, Guid tenantId);
    Task<ApiResponse> DeletePartyAsync(Guid partyId, Guid tenantId);
}
