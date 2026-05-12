using BizCore.Application.DTOs.Inventory;

namespace BizCore.Application.Interfaces;

public interface IDamagedGoodsService
{
    Task<DamagedGoodsDto> CreateAsync(CreateDamagedGoodsDto dto, string reportedBy);
    Task<List<DamagedGoodsDto>> GetAllAsync(DateTime? dateFrom, DateTime? dateTo, string? status);
    Task<DamagedGoodsDto> ApproveAsync(Guid id, string approvedBy);
    Task<DamagedGoodsDto> WriteOffAsync(Guid id);
    Task DeleteAsync(Guid id);
    Task<DamagedGoodsSummaryDto> GetSummaryAsync();
}
