using BizCore.Application.DTOs.Auth;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Shared.Constants;
using BizCore.Shared.Wrappers;
using BizCore.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BizCore.Infrastructure.Data;
using Microsoft.Extensions.Logging;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService authService,
        UserManager<ApplicationUser> userManager,
        AppDbContext context,
        ILogger<AuthController> logger)
    {
        _authService = authService;
        _userManager = userManager;
        _context = context;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Register([FromBody] RegisterDto dto)
    {
        return BadRequest(ApiResponse<AuthResponseDto>.FailResult(
            "Self-registration is disabled. Please contact your system administrator to create an account."));
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] LoginDto dto)
    {
        var result = await _authService.LoginAsync(dto);

        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == dto.Email);

        _context.UserLoginHistories.Add(new UserLoginHistory
        {
            UserId = user?.Id,
            Email = dto.Email,
            IsSuccess = result.Success,
            IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
            UserAgent = Request.Headers.UserAgent.ToString(),
            AttemptedAt = DateTime.UtcNow,
        });
        await _context.SaveChangesAsync();

        return result.Success ? Ok(result) : Unauthorized(result);
    }

    // Tenant app login (requires tenantSlug)
    [AllowAnonymous]
    [HttpPost("tenant-login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> TenantLogin([FromBody] TenantLoginDto dto)
    {
        var result = await _authService.TenantLoginAsync(dto);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("refresh")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Refresh([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.RefreshTokenAsync(dto.RefreshToken);
        return result.Success ? Ok(result) : Unauthorized(result);
    }

    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse>> Logout([FromBody] RefreshTokenDto dto)
    {
        var result = await _authService.LogoutAsync(dto.RefreshToken);
        return Ok(result);
    }

    [HttpGet("verify")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> Verify()
    {
        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized(ApiResponse<object>.FailResult("User is not authenticated."));

        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id.ToString() == userId && !u.IsDeleted);

        if (user == null)
            return Unauthorized(ApiResponse<object>.FailResult("User session invalid or expired."));

        return Ok(ApiResponse<object>.SuccessResult(new
        {
            valid = true,
            user = new
            {
                id = user.Id,
                email = user.Email,
                role = (int)user.Role,
                currentTenantId = user.CurrentTenantId,
                isFirstLogin = user.IsFirstLogin
            }
        }));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<ApiResponse<object>>> Me()
    {
        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized(ApiResponse<object>.FailResult("User is not authenticated."));

        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id.ToString() == userId && !u.IsDeleted);

        if (user == null)
            return NotFound(ApiResponse<object>.FailResult("User not found."));

        if (!Enum.IsDefined(typeof(UserRole), user.Role))
            return BadRequest(ApiResponse<object>.FailResult("Role missing or invalid for this account."));

        return Ok(ApiResponse<object>.SuccessResult(new
        {
            id = user.Id,
            email = user.Email,
            role = (int)user.Role,
            currentTenantId = user.CurrentTenantId,
            isFirstLogin = user.IsFirstLogin
        }));
    }


    [HttpPut("change-password")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (!ModelState.IsValid)
        {
            var modelErrors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .ToList();

            _logger.LogWarning("Change password failed due to model validation. Errors: {Errors}", modelErrors);
            return BadRequest(ApiResponse.FailResult("Invalid request payload.", modelErrors));
        }

        if (dto.NewPassword == dto.CurrentPassword)
            return BadRequest(ApiResponse.FailResult("New password must be different from current password."));

        if (dto.NewPassword != dto.ConfirmPassword)
            return BadRequest(ApiResponse.FailResult("New password and confirm password do not match."));

        var userId = _userManager.GetUserId(User);
        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized(ApiResponse.FailResult("User is not authenticated."));

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return Unauthorized(ApiResponse.FailResult("User not found."));

        if (user.IsFirstLogin && string.IsNullOrWhiteSpace(dto.CurrentPassword))
            return BadRequest(ApiResponse.FailResult("Current temporary password is required for first-time password change."));

        var result = await _userManager.ChangePasswordAsync(user, dto.CurrentPassword, dto.NewPassword);
        if (!result.Succeeded)
        {
            var errors = result.Errors
                .Select(e => $"{e.Code}: {e.Description}")
                .ToList();

            _logger.LogWarning(
                "Change password failed for user {UserId}. IsFirstLogin={IsFirstLogin}. Errors={Errors}",
                user.Id,
                user.IsFirstLogin,
                string.Join(" | ", errors));

            return BadRequest(ApiResponse.FailResult("Failed to change password.", errors));
        }

        if (user.IsFirstLogin)
        {
            user.IsFirstLogin = false;
            await _userManager.UpdateAsync(user);
        }

        _logger.LogInformation("Password changed successfully for user {UserId}", user.Id);

        return Ok(ApiResponse.SuccessResult("Password changed successfully."));
    }

    [HttpPost("accept-invite")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<object>>> AcceptInvite([FromBody] AcceptInviteDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .ToList();

            return BadRequest(ApiResponse<object>.FailResult("Invalid request payload.", errors));
        }

        var result = await _authService.AcceptInviteAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPost("request-password-reset")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> RequestPasswordReset([FromBody] RequestPasswordResetDto dto)
    {
        // Always 200 to prevent user enumeration
        await _authService.RequestPasswordResetAsync(dto);

        // In dev, return a hint message only (token delivery via email is not implemented here)
        return Ok(ApiResponse.SuccessResult("If the account exists, a reset link will be sent."));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse>> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .Where(e => !string.IsNullOrWhiteSpace(e))
                .ToList();

            return BadRequest(ApiResponse.FailResult("Invalid request payload.", errors));
        }

        var result = await _authService.ResetPasswordAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
