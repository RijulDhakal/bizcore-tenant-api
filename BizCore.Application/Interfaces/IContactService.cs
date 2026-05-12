using BizCore.Application.DTOs.Contact;
using BizCore.Application.DTOs.Khata;
using BizCore.Shared.Wrappers;
using PartyDtos = BizCore.Application.DTOs.Party;

namespace BizCore.Application.Interfaces;

public interface IContactService
{
    Task<ApiResponse<ContactDto>> CreateAsync(CreateContactDto dto, Guid tenantId);
    Task<ApiResponse<List<ContactDto>>> GetAllAsync(string? type, string? search, Guid tenantId);
    Task<ApiResponse<ContactDto>> GetByIdAsync(Guid id, Guid tenantId);
    Task<ApiResponse<ContactDto>> UpdateAsync(Guid id, UpdateContactDto dto, Guid tenantId);
    Task<ApiResponse> DeleteAsync(Guid id, Guid tenantId);
    Task<ApiResponse<List<KhataEntryDto>>> GetTransactionsAsync(Guid contactId, Guid tenantId);

    Task<ApiResponse<PartyDtos.PartyLedgerDto>> GetPartyLedgerAsync(Guid contactId, DateTime? fromDate = null, DateTime? toDate = null);
    Task<ApiResponse<PartyDtos.AgingSummaryDto>> GetPartyAgingAsync(Guid contactId);
}
