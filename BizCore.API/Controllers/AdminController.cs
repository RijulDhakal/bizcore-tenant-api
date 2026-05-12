using BizCore.Application.DTOs.Auth;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Security;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BizCore.API.Controllers;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "SuperAdmin,Admin,Owner")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly UserManager<ApplicationUser> _userManager;

    public AdminController(
        AppDbContext context,
        ITenantService tenantService,
        UserManager<ApplicationUser> userManager)
    {
        _context = context;
        _tenantService = tenantService;
        _userManager = userManager;
    }

    // Get team members
    [HttpGet("team")]
    public async Task<IActionResult> GetTeam()
    {
        var tenantId = _tenantService.GetTenantId();
        
        var users = await _context.Users
            .Where(u => !u.IsDeleted && u.CurrentTenantId == tenantId)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.FirstName,
                u.LastName,
                u.Role,
                u.CreatedAt,
                FullName = u.FirstName + " " + u.LastName
            })
            .ToListAsync();

        return Ok(ApiResponse<object>.SuccessResult(users));
    }

    // Create invite (secure provisioning)
    [HttpPost("invites")]
    public async Task<ActionResult<ApiResponse<object>>> CreateInvite([FromBody] CreateInviteDto dto)
    {
        var tenantId = _tenantService.GetTenantId();

        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .ToList();

            return BadRequest(ApiResponse<object>.FailResult("Invalid request payload.", errors));
        }

        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(ApiResponse<object>.FailResult("Email is required."));

        if (!Enum.IsDefined(typeof(UserRole), (UserRole)dto.Role))
            return BadRequest(ApiResponse<object>.FailResult("Invalid role."));

        // Create raw token and store only the hash
        var rawToken = TokenHasher.GenerateRawToken();
        var tokenHash = TokenHasher.Sha256Hex(rawToken);

        var actorRaw = _userManager.GetUserId(User);
        var actorId = Guid.TryParse(actorRaw, out var parsed) ? parsed : Guid.Empty;

        var invite = new UserInvite
        {
            TenantId = tenantId,
            Email = email,
            Role = (UserRole)dto.Role,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByUserId = actorId,
        };

        _context.UserInvites.Add(invite);
        await _context.SaveChangesAsync();

        var responseData = new Dictionary<string, object?>
        {
            ["inviteId"] = invite.Id,
        };

        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
        {
            responseData["token"] = rawToken;
        }

        return Ok(ApiResponse<object>.SuccessResult(responseData, "Invite created."));
    }

    // Legacy invite endpoint (deprecated) - redirects to new secure endpoint
    [HttpPost("team/invite")]
    public async Task<ActionResult<ApiResponse<object>>> InviteTeamMember([FromBody] InviteUserDto dto)
    {
        var createDto = new CreateInviteDto { Email = dto.Email, Role = dto.Role };
        return await CreateInvite(createDto);
    }

    // Remove team member
    [HttpDelete("team/{userId}")]
    public async Task<IActionResult> RemoveTeamMember(string userId)
    {
        var tenantId = _tenantService.GetTenantId();
        
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id.ToString() == userId && u.CurrentTenantId == tenantId && !u.IsDeleted);

        if (user == null)
            return NotFound();

        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse.SuccessResult("Team member removed"));
    }

    // Update team member role
    [HttpPut("team/{userId}/role")]
    public async Task<IActionResult> UpdateMemberRole(string userId, [FromBody] ChangeRoleDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id.ToString() == userId && u.CurrentTenantId == tenantId && !u.IsDeleted);

        if (user == null)
            return NotFound();

        user.Role = (UserRole)dto.Role;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(ApiResponse.SuccessResult("Role updated"));
    }

    // Legacy reset endpoint (deprecated): issue reset token but do not return temp password
    [HttpPost("team/{userId}/reset-password")]
    public async Task<ActionResult<ApiResponse<object>>> ResetPassword(string userId)
    {
        var tenantId = _tenantService.GetTenantId();
        
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id.ToString() == userId && u.CurrentTenantId == tenantId && !u.IsDeleted);

        if (user == null)
            return NotFound(ApiResponse<object>.FailResult("User not found."));

        var rawToken = TokenHasher.GenerateRawToken();
        var tokenHash = TokenHasher.Sha256Hex(rawToken);

        // Revoke previous unused tokens
        var existing = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
        foreach (var t in existing) t.UsedAt = DateTime.UtcNow;

        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.AddHours(2),
        });

        user.IsFirstLogin = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var data = new Dictionary<string, object?> { ["userId"] = user.Id };
        if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            data["token"] = rawToken;

        return Ok(ApiResponse<object>.SuccessResult(data, "Password reset token issued."));
    }
}

public class InviteUserDto
{
    public string Email { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public int Role { get; set; }
}
