using BizCore.Application.DTOs.Business;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IBusinessService
{
    Task<ApiResponse<CreateBusinessResponseDto>> CreateBusinessAsync(CreateBusinessDto dto, Guid userId);
    Task<ApiResponse<BusinessDto>> GetMyBusinessAsync(Guid tenantId);
    Task<ApiResponse<BusinessDto>> GetBusinessByUserIdAsync(Guid userId);
    Task<ApiResponse<BusinessDto>> UpdateBusinessAsync(UpdateBusinessDto dto, Guid tenantId);
    Task<ApiResponse<BranchDto>> CreateBranchAsync(CreateBranchDto dto, Guid tenantId);
    Task<ApiResponse<List<BranchDto>>> GetBranchesAsync(Guid tenantId);
}
