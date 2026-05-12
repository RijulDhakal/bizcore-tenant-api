using BizCore.Application.DTOs.Business;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Infrastructure.Services.Helpers;
using BizCore.Shared.Constants;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/superadmin")]
[Authorize(Roles = "SuperAdmin")]
public class SuperAdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PlatformDbContext _platform;
    private readonly ITenantDirectoryClient _tenantDirectory;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IBusinessService _businessService;
    private readonly IEmailService _emailService;
    private readonly ILogger<SuperAdminController> _logger;

    public SuperAdminController(
        AppDbContext context,
        PlatformDbContext platform,
        ITenantDirectoryClient tenantDirectory,
        UserManager<ApplicationUser> userManager,
        IBusinessService businessService,
        IEmailService emailService,
        ILogger<SuperAdminController> logger)
    {
        _context = context;
        _platform = platform;
        _tenantDirectory = tenantDirectory;
        _userManager = userManager;
        _businessService = businessService;
        _emailService = emailService;
        _logger = logger;
    }

    private Guid UserId => Guid.TryParse(User.FindFirst("uid")?.Value ?? User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var uid) ? uid : Guid.Empty;
    private bool IsSuperAdmin() => User.IsInRole("SuperAdmin");

    private async Task AddAuditLogAsync(string action, string targetType, Guid? targetId, string details)
    {
        var log = new SuperAdminAuditLog
        {
            Id = Guid.NewGuid(),
            ActorUserId = UserId,
            Action = action,
            TargetType = targetType,
            TargetId = targetId,
            Details = details,
            PerformedAt = DateTime.UtcNow
        };
        _platform.SuperAdminAuditLogs.Add(log);
        await _platform.SaveChangesAsync();
    }

    // ========== DASHBOARD & STATS ==========

    private static string RoleName(UserRole role) => role switch
    {
        UserRole.SuperAdmin => "SuperAdmin",
        UserRole.Admin => "Admin",
        UserRole.Accountant => "Accountant",
        UserRole.Sales => "Sales",
        UserRole.POSOperator => "POS Operator",
        UserRole.Owner => "Owner",
        UserRole.HRManager => "HR Manager",
        _ => "Unknown"
    };

    [HttpGet("stats")]
    public async Task<IActionResult> GetCoreStats()
    {
        if (!IsSuperAdmin()) return Forbid();

        var totalBusinesses = 0;
        object recentSignups = Array.Empty<object>();
        try
        {
            var tenants = await _tenantDirectory.ListTenantsAsync();
            totalBusinesses = tenants.Count;
            recentSignups = tenants
                .OrderByDescending(t => t.CreatedAt ?? DateTime.MinValue)
                .Take(5)
                .Select(t => new { id = t.TenantId, name = t.Name, createdAt = t.CreatedAt })
                .ToList();
        }
        catch
        {
            // Tenant directory may be unavailable in some environments; keep stats partial.
        }

        var totalUsers = await _userManager.Users.CountAsync(u => !u.IsDeleted);

        // Calculate real platform revenue across all tenants
        // Must use IgnoreQueryFilters() to bypass the global TenantId filter
        var posRevenue = await _context.POSTransactions.IgnoreQueryFilters()
            .Where(s => !s.IsDeleted)
            .SumAsync(s => (decimal?)s.TotalAmount) ?? 0;
        var invoiceRevenue = await _context.Invoices.IgnoreQueryFilters()
            .Where(i => !i.IsDeleted && i.Status == InvoiceStatus.Paid)
            .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

        return Ok(ApiResponse<object>.SuccessResult(new
        {
            totalBusinesses,
            totalUsers,
            activeSubscriptions = totalBusinesses,
            totalRevenue = posRevenue + invoiceRevenue,
            recentSignups
        }));
    }

    // ========== ONBOARDING ==========

    [HttpPost("onboard")]
    public async Task<IActionResult> OnboardClient([FromBody] OnboardClientDto dto)
    {
        if (!IsSuperAdmin()) return Forbid();

        // Tenant provisioning and directory metadata are owned by the SuperAdmin service.
        // The tenant app must not create Businesses/Branches (or similar) in any database.
        return StatusCode(501, ApiResponse<object>.FailResult("Provisioning is managed by SuperAdmin."));
    }

    // ========== DIRECTORIES ==========

    [HttpGet("businesses")]
    public async Task<IActionResult> GetBusinesses([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        if (!IsSuperAdmin()) return Forbid();

        try
        {
            var tenants = await _tenantDirectory.ListTenantsAsync();

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLowerInvariant();
                tenants = tenants
                    .Where(t => t.Name.ToLowerInvariant().Contains(term))
                    .ToList();
            }

            var total = tenants.Count;
            var data = tenants
                .OrderByDescending(t => t.CreatedAt ?? DateTime.MinValue)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(t => new
                {
                    // Keep response shape stable for consumers expecting an "Id".
                    Id = t.TenantId,
                    Name = t.Name,
                    TenantId = t.TenantId,
                    BusinessType = (string?)null,
                    Email = (string?)null,
                    Phone = (string?)null,
                    City = (string?)null,
                    CreatedAt = t.CreatedAt,
                    Status = "ACTIVE",
                    OwnerName = "",
                    UserCount = _context.Users.IgnoreQueryFilters().Count(u => !u.IsDeleted && u.CurrentTenantId == t.TenantId),
                    Revenue = (_context.POSTransactions.IgnoreQueryFilters()
                        .Where(tr => !tr.IsDeleted && tr.TenantId == t.TenantId)
                        .Sum(tr => (decimal?)tr.TotalAmount) ?? 0)
                        +
                        (_context.Invoices.IgnoreQueryFilters()
                        .Where(i => !i.IsDeleted && i.TenantId == t.TenantId && i.Status == InvoiceStatus.Paid)
                        .Sum(i => (decimal?)i.TotalAmount) ?? 0)
                })
                .ToList();

            return Ok(ApiResponse<object>.SuccessResult(new
            {
                data,
                pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) }
            }));
        }
        catch
        {
            return StatusCode(502, ApiResponse<object>.FailResult("Tenant directory is not available."));
        }
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] string? search, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = "active")
    {
        if (!IsSuperAdmin()) return Forbid();

        var query = _userManager.Users
            .Where(u => !u.IsDeleted)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.ToLower();
            query = query.Where(u => u.Email!.ToLower().Contains(term) || u.FirstName.ToLower().Contains(term) || u.LastName.ToLower().Contains(term));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Role,
                u.IsActive,
                u.CreatedAt,
                BusinessId = u.BusinessId,
                BusinessName = "N/A"
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.SuccessResult(new { data = users, pagination = new { page, pageSize, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) } }));
    }

    // ========== BUSINESS MANAGEMENT (CASCADE) ==========

    [HttpGet("businesses/{id:guid}")]
    public Task<IActionResult> GetBusinessDetail(Guid id)
        => Task.FromResult<IActionResult>(StatusCode(501, ApiResponse<object>.FailResult("Business management is handled by SuperAdmin.")));

    [HttpDelete("businesses/{id:guid}")]
    public Task<IActionResult> DeleteBusiness(Guid id, [FromQuery] bool permanent = false)
        => Task.FromResult<IActionResult>(StatusCode(501, ApiResponse<object>.FailResult("Business management is handled by SuperAdmin.")));

    [HttpPost("businesses/{id:guid}/restore")]
    public Task<IActionResult> RestoreBusiness(Guid id)
        => Task.FromResult<IActionResult>(StatusCode(501, ApiResponse<object>.FailResult("Business management is handled by SuperAdmin.")));

    // ========== USER MANAGEMENT ==========

    [HttpDelete("users/{id:guid}")]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        if (!IsSuperAdmin()) return Forbid();

        try
        {
            var user = await _userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

            if (user == null)
                return NotFound(ApiResponse<object>.FailResult("User not found"));

            // Prevent deleting SuperAdmin users
            if (user.Role == UserRole.SuperAdmin)
                return BadRequest(ApiResponse<object>.FailResult("Cannot delete a SuperAdmin account"));

            // Prevent deleting the last Owner of a business
            if (user.Role == UserRole.Owner && user.BusinessId.HasValue)
            {
                var otherOwners = await _userManager.Users
                    .IgnoreQueryFilters()
                    .CountAsync(u => u.BusinessId == user.BusinessId
                                  && u.Role == UserRole.Owner
                                  && !u.IsDeleted
                                  && u.Id != id);

                if (otherOwners == 0)
                    return BadRequest(ApiResponse<object>.FailResult(
                        "Cannot delete the last Owner. Business must have at least one owner. Transfer ownership first."));
            }

            // Soft delete the user
            user.IsDeleted = true;
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            // Revoke all refresh tokens
            var tokens = await _context.RefreshTokens
                .Where(rt => rt.UserId == user.Id && !rt.IsRevoked)
                .ToListAsync();
            foreach (var token in tokens) token.IsRevoked = true;

            await _context.SaveChangesAsync();

            await AddAuditLogAsync("user.deleted", "user", id, $"email={user.Email},role={user.Role}");

            return Ok(ApiResponse<object>.SuccessResult(new
            {
                Message = $"User {user.Email} has been deleted."
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user {Id}", id);
            return StatusCode(500, ApiResponse<object>.FailResult(ex.Message));
        }
    }

    [HttpPost("users/{id:guid}/restore")]
    public async Task<IActionResult> RestoreUser(Guid id)
    {
        if (!IsSuperAdmin()) return Forbid();

        try
        {
            var user = await _userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Id == id && u.IsDeleted);

            if (user == null)
                return NotFound(ApiResponse<object>.FailResult("Deleted user not found"));

            user.IsDeleted = false;
            user.IsActive = true;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await AddAuditLogAsync("user.restored", "user", id, $"email={user.Email}");

            return Ok(ApiResponse<object>.SuccessResult(new
            {
                Message = $"User {user.Email} has been restored."
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error restoring user {Id}", id);
            return StatusCode(500, ApiResponse<object>.FailResult(ex.Message));
        }
    }

    // ========== ANALYTICS ==========

    [HttpGet("businesses/{id:guid}/revenue-trend")]
    public async Task<IActionResult> GetRevenueTrend(Guid id, [FromQuery] int months = 12)
    {
        if (!IsSuperAdmin()) return Forbid();
        return StatusCode(501, ApiResponse<object>.FailResult("Business analytics is handled by SuperAdmin."));
    }

    // ========== UPDATE BUSINESS STATUS (Suspend/Activate) ==========

    [HttpPatch("businesses/{id:guid}/status")]
    public async Task<IActionResult> UpdateBusinessStatus(Guid id, [FromBody] UpdateBusinessStatusDto dto)
    {
        if (!IsSuperAdmin()) return Forbid();
        return StatusCode(501, ApiResponse<object>.FailResult("Business status management is handled by SuperAdmin."));
    }

    // ========== SUPERADMIN PASSWORD RESET ==========

    [HttpPost("users/{id:guid}/reset-password")]
    public async Task<IActionResult> ResetUserPassword(Guid id)
    {
        try
        {
            if (!IsSuperAdmin()) return Forbid();
            
            var user = await _userManager.FindByIdAsync(id.ToString());
            if (user == null)
                return NotFound(new { success = false, message = "User not found" });
            
            // Generate temporary password
            var tempPassword = PasswordGenerator.GenerateSecurePassword();
            
            // Remove existing password and add new one
            // We use Remove/Add instead of GeneratePasswordResetToken to make it immediate for the Admin
            var removeResult = await _userManager.RemovePasswordAsync(user);
            if (!removeResult.Succeeded)
            {
                return BadRequest(new { success = false, message = "Failed to clear existing password" });
            }
            
            var addResult = await _userManager.AddPasswordAsync(user, tempPassword);
            if (!addResult.Succeeded)
            {
                return BadRequest(new { success = false, message = "Failed to set new temporary password" });
            }
            
            // Force password change on next login
            user.IsFirstLogin = true;
            user.UpdatedAt = DateTime.UtcNow;
            await _userManager.UpdateAsync(user);
            
            // Send email with new password
            await _emailService.SendPasswordResetEmailAsync(user.Email!, tempPassword);
            
            // Log action
            await AddAuditLogAsync("user.password_reset", "user", user.Id, $"Password for user {user.Email} reset by SuperAdmin");

            // Return temp password to SuperAdmin (shown once in UI)
            return Ok(new
            {
                success = true,
                message = "Password reset successfully. A temporary password has been sent to the user.",
                data = new
                {
                    temporaryPassword = tempPassword,
                    userEmail = user.Email
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error resetting password for user {UserId}", id);
            return StatusCode(500, new { success = false, message = "Internal server error during password reset" });
        }
    }
}

public class UpdateBusinessStatusDto { public string Status { get; set; } = string.Empty; }
public class OnboardClientDto
{
    // Section 1: Business Information
    [System.Text.Json.Serialization.JsonPropertyName("businessName")]
    public string BusinessName { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("legalName")]
    public string? LegalName { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("businessType")]
    public string? BusinessType { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("businessEmail")]
    public string? BusinessEmail { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("businessPhone")]
    public string? BusinessPhone { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("alternateBusinessPhone")]
    public string? AlternateBusinessPhone { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("businessWebsite")]
    public string? BusinessWebsite { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("businessDescription")]
    public string? BusinessDescription { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("industryCategory")]
    public string? IndustryCategory { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("specifyIndustry")]
    public string? SpecifyIndustry { get; set; }

    // Section 2: Business Address
    [System.Text.Json.Serialization.JsonPropertyName("streetAddress")]
    public string? StreetAddress { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("addressLine2")]
    public string? AddressLine2 { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("city")]
    public string? City { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("district")]
    public string? District { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("province")]
    public string? Province { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("postalCode")]
    public string? PostalCode { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("country")]
    public string? Country { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("googleMapsLink")]
    public string? GoogleMapsLink { get; set; }

    // Section 3: Tax & Registration
    [System.Text.Json.Serialization.JsonPropertyName("panNumber")]
    public string? PanNumber { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("isVatRegistered")]
    public bool IsVatRegistered { get; set; } = false;

    [System.Text.Json.Serialization.JsonPropertyName("vatNumber")]
    public string? VatNumber { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("registrationNumber")]
    public string? RegistrationNumber { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("registrationDate")]
    public DateTime? RegistrationDate { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("taxpayerType")]
    public string? TaxpayerType { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("nicCode")]
    public string? NicCode { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("msmeCategory")]
    public string? MsmeCategory { get; set; }

    // Section 4: Owner Account
    [System.Text.Json.Serialization.JsonPropertyName("title")]
    public string? Title { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("firstName")]
    public string FirstName { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("middleName")]
    public string? MiddleName { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("lastName")]
    public string LastName { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("designation")]
    public string? Designation { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("email")]
    public string Email { get; set; } = string.Empty;

    [System.Text.Json.Serialization.JsonPropertyName("alternateEmail")]
    public string? AlternateEmail { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("phone")]
    public string? Phone { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("alternatePhone")]
    public string? AlternatePhone { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("citizenshipNumber")]
    public string? CitizenshipNumber { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("passportNumber")]
    public string? PassportNumber { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("dateOfBirth")]
    public DateTime? DateOfBirth { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("gender")]
    public string? Gender { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("password")]
    public string Password { get; set; } = string.Empty;

    // Section 5: Banking Details
    [System.Text.Json.Serialization.JsonPropertyName("bankName")]
    public string? BankName { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("bankAccountNumber")]
    public string? BankAccountNumber { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("bankAccountName")]
    public string? BankAccountName { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("bankBranch")]
    public string? BankBranch { get; set; }

    // Section 6: Business Settings
    [System.Text.Json.Serialization.JsonPropertyName("defaultCurrency")]
    public string? DefaultCurrency { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("fiscalYearStart")]
    public string? FiscalYearStart { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("dateFormat")]
    public string? DateFormat { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("timeZoneId")]
    public string? TimeZoneId { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("invoicePrefix")]
    public string? InvoicePrefix { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("languagePref")]
    public string? LanguagePref { get; set; }
}

public class ChangeRoleDto
{
    public int Role { get; set; }
}
