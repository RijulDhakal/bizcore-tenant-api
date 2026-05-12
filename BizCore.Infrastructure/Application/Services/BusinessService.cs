using BizCore.Application.DTOs.Business;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Services;

public class BusinessService : IBusinessService
{
    private readonly AppDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtService _jwtService;
    private readonly ITenantDirectoryClient _tenantDirectory;

    public BusinessService(
        AppDbContext context,
        UserManager<ApplicationUser> userManager,
        IJwtService jwtService,
        ITenantDirectoryClient tenantDirectory)
    {
        _context = context;
        _userManager = userManager;
        _jwtService = jwtService;
        _tenantDirectory = tenantDirectory;
    }

    public async Task<ApiResponse<CreateBusinessResponseDto>> CreateBusinessAsync(CreateBusinessDto dto, Guid userId)
    {
        // Tenant provisioning is owned by SuperAdmin. Tenant App must not create business metadata
        // (and therefore must not create/update MAIN DB schema).
        return ApiResponse<CreateBusinessResponseDto>.FailResult(
            "Business provisioning is managed by SuperAdmin. Please onboard the tenant via SuperAdmin API.");
    }

    public async Task<ApiResponse<BusinessDto>> GetMyBusinessAsync(Guid tenantId)
    {
        var tenant = await _tenantDirectory.GetTenantProfileAsync(tenantId);
        if (tenant == null)
            return ApiResponse<BusinessDto>.FailResult("Business not found.");

        return ApiResponse<BusinessDto>.SuccessResult(MapTenant(tenant));
    }

    public async Task<ApiResponse<BusinessDto>> GetBusinessByUserIdAsync(Guid userId)
    {
        var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null || user.CurrentTenantId == null)
            return ApiResponse<BusinessDto>.FailResult("No active business session found for this user.");

        return await GetMyBusinessAsync(user.CurrentTenantId.Value);
    }

    public async Task<ApiResponse<BusinessDto>> UpdateBusinessAsync(UpdateBusinessDto dto, Guid tenantId)
    {
        var update = new BizCore.Application.DTOs.Tenants.UpdateTenantProfileDto(
            Name: dto.Name,
            BusinessType: dto.BusinessType,
            Email: dto.Email,
            Phone: dto.Phone,
            Address: dto.Address,
            City: dto.City,
            District: dto.District,
            PANNumber: dto.PANNumber,
            IsVATRegistered: dto.IsVATRegistered,
            VATNumber: dto.VATNumber,
            Website: dto.Website,
            Description: dto.Description);

        var ok = await _tenantDirectory.UpdateTenantProfileAsync(tenantId, update);
        if (!ok)
            return ApiResponse<BusinessDto>.FailResult("Failed to update business profile in SuperAdmin.");

        var refreshed = await _tenantDirectory.GetTenantProfileAsync(tenantId);
        return refreshed == null
            ? ApiResponse<BusinessDto>.FailResult("Business not found.")
            : ApiResponse<BusinessDto>.SuccessResult(MapTenant(refreshed), "Business updated.");
    }

    public async Task<ApiResponse<BranchDto>> CreateBranchAsync(CreateBranchDto dto, Guid tenantId)
    {
        return ApiResponse<BranchDto>.FailResult("Branch management is handled by SuperAdmin.");
    }

    public async Task<ApiResponse<List<BranchDto>>> GetBranchesAsync(Guid tenantId)
    {
        return ApiResponse<List<BranchDto>>.SuccessResult([]);
    }

    private static BusinessDto MapTenant(BizCore.Application.DTOs.Tenants.TenantProfileDto t) => new()
    {
        Id = t.BusinessId ?? Guid.Empty,
        TenantId = t.TenantId,
        Name = t.Name,
        BusinessType = string.Empty,
        Email = t.Email,
        Address = null,
        Phone = t.Phone,
        City = null,
        District = null,
        PANNumber = null,
        IsVATRegistered = false,
        VATNumber = null,
        DefaultCurrency = "NPR",
        FiscalYearStart = "Shrawan",
        LogoUrl = null,
        Website = null,
        Description = null,
        CreatedAt = DateTime.UtcNow,
        OnboardingStatus = t.OnboardingStatusJson
    };
}
