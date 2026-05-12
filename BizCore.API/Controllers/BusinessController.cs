using BizCore.Application.DTOs.Business;
using BizCore.Application.Interfaces;
using BizCore.Shared.Constants;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BizCore.Infrastructure.Data;
using BizCore.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using BizCore.Domain.Enums;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/business")]
[Authorize]
public class BusinessController : ControllerBase
{
    private readonly IBusinessService _businessService;
    private readonly AppDbContext _context;
    private readonly ITenantDirectoryClient _tenantDirectory;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ITenantService _tenantService;

    public BusinessController(
        IBusinessService businessService,
        AppDbContext context,
        ITenantDirectoryClient tenantDirectory,
        UserManager<ApplicationUser> userManager,
        ITenantService tenantService)
    {
        _businessService = businessService;
        _context = context;
        _tenantDirectory = tenantDirectory;
        _userManager = userManager;
        _tenantService = tenantService;
    }

    private Guid UserId => Guid.TryParse(User.FindFirst("uid")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : Guid.Empty;
    private Guid TenantId => Guid.TryParse(User.FindFirst("tid")?.Value, out var tid) ? tid : Guid.Empty;

    [HttpPost("create")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<ActionResult<ApiResponse<CreateBusinessResponseDto>>> Create([FromBody] CreateBusinessDto dto)
    {
        var result = await _businessService.CreateBusinessAsync(dto, UserId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<BusinessDto>>> GetMe()
    {
        if (TenantId != Guid.Empty)
        {
            var result = await _businessService.GetMyBusinessAsync(TenantId);
            if (result.Success) return Ok(result);
        }

        var fallbackResult = await _businessService.GetBusinessByUserIdAsync(UserId);
        return fallbackResult.Success ? Ok(fallbackResult) : NotFound(fallbackResult);
    }

    // ===== GET COMPLETE BUSINESS PROFILE (For Owner) =====
    [HttpGet("profile")]
    public async Task<IActionResult> GetBusinessProfile()
    {
        try
        {
            var tenantId = _tenantService.GetTenantId();

            var tenant = await _tenantDirectory.GetTenantProfileAsync(tenantId);
            if (tenant == null)
                return NotFound(new { success = false, message = "Business not found" });
            
            // Get owner
            ApplicationUser? owner = null;
            if (tenant.OwnerId.HasValue)
            {
                owner = await _userManager.Users
                    .FirstOrDefaultAsync(u => u.Id == tenant.OwnerId.Value);
            }
            
            // Get banking details
            var bankAccount = await _context.BankAccounts
                .FirstOrDefaultAsync(b => b.TenantId == tenantId);
            
            // Get all staff members
            var staff = await _userManager.Users
                .Where(u => u.CurrentTenantId == tenantId && !u.IsDeleted && (!tenant.OwnerId.HasValue || u.Id != tenant.OwnerId.Value))
                .Select(u => new
                {
                    u.Id,
                    u.FirstName,
                    u.LastName,
                    u.Email,
                    u.Role,
                    u.IsActive,
                    u.CreatedAt
                })
                .ToListAsync();
            
            return Ok(new
            {
                success = true,
                data = new
                {
                    // Business Profile
                    tenant.BusinessId,
                    tenant.Name,
                    tenant.Email,
                    tenant.Phone,
                    OnboardingStatus = tenant.OnboardingStatusJson,
                    
                    // Address
                    Address = (string?)null,
                    AddressLine2 = (string?)null,
                    City = (string?)null,
                    District = (string?)null,
                    Province = (string?)null,
                    PostalCode = (string?)null,
                    Country = (string?)null,
                    MapsLocation = (string?)null,
                    
                    // Status
                    Status = (string?)null,
                    CreatedAt = (DateTime?)null,
                    
                    // Settings
                    DefaultCurrency = (string?)null,
                    FiscalYearStart = (string?)null,
                    DateFormat = (string?)null,
                    TimeZone = (string?)null,
                    InvoicePrefix = (string?)null,
                    Language = (string?)null,
                    
                    // Owner Details
                    Owner = owner != null ? new
                    {
                        owner.FirstName,
                        owner.LastName,
                        owner.Title,
                        owner.Designation,
                        owner.Email,
                        owner.AlternateEmail,
                        owner.PhoneNumber,
                        owner.AlternatePhone,
                        owner.Gender,
                        owner.DateOfBirth,
                        owner.CitizenshipNumber,
                        owner.PassportNumber,
                        Role = "Owner"
                    } : null,
                    
                    // Banking
                    Banking = bankAccount != null ? new
                    {
                        bankAccount.BankName,
                        bankAccount.BranchName,
                        bankAccount.AccountNumber,
                        bankAccount.AccountName
                    } : null,
                    
                    // Staff Members
                    Staff = staff,
                    StaffCount = staff.Count
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // ===== UPDATE BUSINESS PROFILE (For Owner) =====
    [HttpPut("profile")]
    [Authorize(Roles = "Owner,Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateBusinessProfile([FromBody] UpdateBusinessProfileDto dto)
    {
        try
        {
            var tenantId = _tenantService.GetTenantId();

            var ok = await _tenantDirectory.UpdateTenantProfileAsync(
                tenantId,
                new BizCore.Application.DTOs.Tenants.UpdateTenantProfileDto(
                    Name: dto.BusinessName,
                    LegalName: dto.LegalName,
                    BusinessType: dto.BusinessType,
                    Email: dto.Email,
                    Phone: dto.Phone,
                    AlternatePhone: dto.AlternatePhone,
                    Website: dto.Website,
                    Description: dto.Description,
                    Address: dto.Address,
                    AddressLine2: dto.AddressLine2,
                    City: dto.City,
                    District: dto.District,
                    Province: dto.Province,
                    PostalCode: dto.PostalCode,
                    Country: dto.Country,
                    PANNumber: dto.PANNumber,
                    IsVATRegistered: dto.IsVATRegistered,
                    VATNumber: dto.VATNumber));

            if (!ok)
                return StatusCode(502, new { success = false, message = "Failed to update business profile via SuperAdmin API" });
            
            return Ok(new { success = true, message = "Business profile updated" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    // ===== UPDATE OWNER PROFILE =====
    [HttpPut("owner/profile")]
    [Authorize(Roles = "Owner,Admin,SuperAdmin")]
    public async Task<IActionResult> UpdateOwnerProfile([FromBody] UpdateOwnerProfileDto dto)
    {
        try
        {
            var tenantId = _tenantService.GetTenantId();
            var tenant = await _tenantDirectory.GetTenantProfileAsync(tenantId);
            if (tenant == null)
                return NotFound(new { success = false, message = "Business not found" });

            if (tenant.OwnerId == null)
                return NotFound(new { success = false, message = "Owner not linked to this business" });

            var owner = await _userManager.FindByIdAsync(tenant.OwnerId.ToString()!);
            
            if (owner == null)
                return NotFound(new { success = false, message = "Owner not found" });
            
            // Update fields
            owner.Title = dto.Title ?? owner.Title;
            owner.FirstName = dto.FirstName ?? owner.FirstName;
            owner.MiddleName = dto.MiddleName ?? owner.MiddleName;
            owner.LastName = dto.LastName ?? owner.LastName;
            owner.Designation = dto.Designation ?? owner.Designation;
            owner.Gender = dto.Gender ?? owner.Gender;
            owner.DateOfBirth = dto.DateOfBirth ?? owner.DateOfBirth;
            owner.PhoneNumber = dto.Phone ?? owner.PhoneNumber;
            owner.AlternateEmail = dto.AlternateEmail ?? owner.AlternateEmail;
            owner.AlternatePhone = dto.AlternatePhone ?? owner.AlternatePhone;
            owner.CitizenshipNumber = dto.CitizenshipNumber ?? owner.CitizenshipNumber;
            owner.PassportNumber = dto.PassportNumber ?? owner.PassportNumber;
            owner.UpdatedAt = DateTime.UtcNow;
            
            var result = await _userManager.UpdateAsync(owner);
            
            if (!result.Succeeded)
                return BadRequest(new { success = false, errors = result.Errors });
            
            return Ok(new { success = true, message = "Owner profile updated" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPut("update")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<ActionResult<ApiResponse<BusinessDto>>> Update([FromBody] UpdateBusinessDto dto)
    {
        var result = await _businessService.UpdateBusinessAsync(dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("branch/create")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<ActionResult<ApiResponse<BranchDto>>> CreateBranch([FromBody] CreateBranchDto dto)
    {
        var result = await _businessService.CreateBranchAsync(dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("branches")]
    public async Task<ActionResult<ApiResponse<List<BranchDto>>>> GetBranches()
    {
        var result = await _businessService.GetBranchesAsync(TenantId);
        return Ok(result);
    }

}
