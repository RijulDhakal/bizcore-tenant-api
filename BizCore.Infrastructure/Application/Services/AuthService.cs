using BizCore.Application.DTOs.Auth;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Infrastructure.Services;
using BizCore.Infrastructure.Services.Helpers;
using BizCore.Shared.Security;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;
    private readonly ITenantDirectoryClient _tenantDirectory;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;

    // Token expiry defaults (can be moved to config later)
    private static readonly TimeSpan InviteTokenLifetime = TimeSpan.FromDays(7);
    private static readonly TimeSpan ResetTokenLifetime = TimeSpan.FromHours(2);

    public AuthService(
        UserManager<ApplicationUser> userManager, 
        AppDbContext context, 
        ITenantDirectoryClient tenantDirectory,
        IJwtService jwtService,
        IEmailService emailService)
    {
        _userManager = userManager;
        _context = context;
        _tenantDirectory = tenantDirectory;
        _jwtService = jwtService;
        _emailService = emailService;
    }

    public async Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto)
    {
        // SECURITY: Never allow SuperAdmin registration via API
        if (dto.Role == (int)UserRole.SuperAdmin)
            return ApiResponse<AuthResponseDto>.FailResult("SuperAdmin cannot be created through registration.");

        if (dto.Password != dto.ConfirmPassword)
            return ApiResponse<AuthResponseDto>.FailResult("Passwords do not match.");

        var existingUser = await _userManager.FindByEmailAsync(dto.Email);
        if (existingUser != null)
            return ApiResponse<AuthResponseDto>.FailResult("Email is already registered.");

        var user = new ApplicationUser
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            UserName = dto.Email,
            Role = UserRole.Owner
        };

        var result = await _userManager.CreateAsync(user, dto.Password);
        if (!result.Succeeded)
            return ApiResponse<AuthResponseDto>.FailResult("Registration failed.", result.Errors.Select(e => e.Description).ToList());

        return await CreateAuthResponseAsync(user);
    }

    public async Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto)
    {
        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == dto.Email && !u.IsDeleted);

        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return ApiResponse<AuthResponseDto>.FailResult("Invalid email or password.");

        if (!Enum.IsDefined(typeof(UserRole), user.Role))
            return ApiResponse<AuthResponseDto>.FailResult("Role missing or invalid for this account.");

        if (user.Role != UserRole.SuperAdmin && (!user.CurrentTenantId.HasValue || user.CurrentTenantId.Value == Guid.Empty))
        {
            var tenants = await _tenantDirectory.ListTenantsAsync();
            var tenant = tenants
                .OrderByDescending(t => t.CreatedAt ?? DateTime.MinValue)
                .FirstOrDefault();

            if (tenant != null)
            {
                user.CurrentTenantId = tenant.TenantId;
                await _userManager.UpdateAsync(user);
                Console.WriteLine($"[Auth] Fixed TenantId for {user.Email}: {tenant.TenantId}");
            }
            else
            {
                return ApiResponse<AuthResponseDto>.FailResult("Tenant assignment missing for this account.");
            }
        }

        Console.WriteLine($"[Auth] Login: {user.Email}, TenantId: {user.CurrentTenantId}");

        return await CreateAuthResponseAsync(user);
    }

    public async Task<ApiResponse<AuthResponseDto>> TenantLoginAsync(TenantLoginDto dto)
    {
        var tenantSlug = SlugHelper.Slugify(dto.TenantSlug);
        if (string.IsNullOrWhiteSpace(tenantSlug))
            return ApiResponse<AuthResponseDto>.FailResult("Tenant slug is required.");

        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return ApiResponse<AuthResponseDto>.FailResult("Email is required.");

        if (string.IsNullOrWhiteSpace(dto.Password))
            return ApiResponse<AuthResponseDto>.FailResult("Password is required.");

        var tenant = await _tenantDirectory.ResolveTenantBySlugAsync(tenantSlug, cancellationToken: default);
        if (tenant == null)
            return ApiResponse<AuthResponseDto>.FailResult("Invalid tenant.");

        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == email && !u.IsDeleted);

        if (user == null || !await _userManager.CheckPasswordAsync(user, dto.Password))
            return ApiResponse<AuthResponseDto>.FailResult("Invalid email or password.");

        if (!Enum.IsDefined(typeof(UserRole), user.Role))
            return ApiResponse<AuthResponseDto>.FailResult("Role missing or invalid for this account.");

        if (user.Role == UserRole.SuperAdmin)
            return ApiResponse<AuthResponseDto>.FailResult("SuperAdmin cannot log into tenant.");

        if (user.CurrentTenantId.HasValue && user.CurrentTenantId.Value != Guid.Empty && user.CurrentTenantId.Value != tenant.TenantId)
            return ApiResponse<AuthResponseDto>.FailResult("This account does not belong to the specified tenant.");

        if (!user.CurrentTenantId.HasValue || user.CurrentTenantId.Value == Guid.Empty)
        {
            user.CurrentTenantId = tenant.TenantId;
            await _userManager.UpdateAsync(user);
        }

        return await CreateAuthResponseAsync(user);
    }

    public async Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .IgnoreQueryFilters()
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken && !rt.IsRevoked && !rt.IsDeleted);

        if (storedToken == null || storedToken.ExpiresAt < DateTime.UtcNow)
            return ApiResponse<AuthResponseDto>.FailResult("Invalid or expired refresh token.");

        // Rotate refresh token
        storedToken.IsRevoked = true;
        storedToken.UpdatedAt = DateTime.UtcNow;

        var user = storedToken.User;
        var response = await CreateAuthResponseAsync(user);
        storedToken.ReplacedByToken = response.Data?.RefreshToken;
        await _context.SaveChangesAsync();

        return response;
    }

    public async Task<ApiResponse> LogoutAsync(string refreshToken)
    {
        var storedToken = await _context.RefreshTokens
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(rt => rt.Token == refreshToken);

        if (storedToken != null)
        {
            storedToken.IsRevoked = true;
            storedToken.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        return ApiResponse.SuccessResult("Logged out successfully.");
    }

    public async Task<ApiResponse<object>> AcceptInviteAsync(AcceptInviteDto dto)
    {
        var tokenHash = TokenHasher.Sha256Hex(dto.Token);

        var invite = await _context.UserInvites
            .FirstOrDefaultAsync(i => i.TokenHash == tokenHash && i.UsedAt == null && i.ExpiresAt > DateTime.UtcNow);

        if (invite == null)
            return ApiResponse<object>.FailResult("Invalid or expired invite token.");

        var email = invite.Email.Trim().ToLowerInvariant();

        var existing = await _userManager.FindByEmailAsync(email);
        if (existing != null)
        {
            // Link existing user to tenant + role (idempotent join)
            existing.CurrentTenantId = invite.TenantId;
            existing.Role = invite.Role;
            existing.IsDeleted = false;
            existing.IsFirstLogin = false;
            var updateExisting = await _userManager.UpdateAsync(existing);
            if (!updateExisting.Succeeded)
                return ApiResponse<object>.FailResult("Failed to attach invited user.", updateExisting.Errors.Select(e => e.Description).ToList());

            invite.UsedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return ApiResponse<object>.SuccessResult(new { userId = existing.Id }, "Invite accepted.");
        }

        var user = new ApplicationUser
        {
            Email = email,
            UserName = email,
            FirstName = string.Empty,
            LastName = string.Empty,
            CurrentTenantId = invite.TenantId,
            Role = invite.Role,
            IsFirstLogin = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        var create = await _userManager.CreateAsync(user, dto.Password);
        if (!create.Succeeded)
            return ApiResponse<object>.FailResult("Invite acceptance failed.", create.Errors.Select(e => e.Description).ToList());

        invite.UsedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return ApiResponse<object>.SuccessResult(new { userId = user.Id }, "Invite accepted.");
    }

    public async Task<ApiResponse> RequestPasswordResetAsync(RequestPasswordResetDto dto)
    {
        // Always return success to prevent user enumeration
        var email = (dto.Email ?? string.Empty).Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(email))
            return ApiResponse.SuccessResult("If the account exists, a reset link will be sent.");

        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == email && !u.IsDeleted);

        if (user == null)
            return ApiResponse.SuccessResult("If the account exists, a reset link will be sent.");

        var rawToken = TokenHasher.GenerateRawToken();
        var tokenHash = TokenHasher.Sha256Hex(rawToken);

        // Revoke existing unused tokens
        var existingTokens = await _context.PasswordResetTokens
            .Where(t => t.UserId == user.Id && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

        foreach (var t in existingTokens)
            t.UsedAt = DateTime.UtcNow;

        _context.PasswordResetTokens.Add(new PasswordResetToken
        {
            UserId = user.Id,
            TokenHash = tokenHash,
            ExpiresAt = DateTime.UtcNow.Add(ResetTokenLifetime),
        });

        await _context.SaveChangesAsync();

        // Send reset email
        await _emailService.SendPasswordResetEmailAsync(user.Email!, rawToken);

        return ApiResponse.SuccessResult("If the account exists, a reset link will be sent.");
    }

    public async Task<ApiResponse> ResetPasswordAsync(ResetPasswordDto dto)
    {
        var tokenHash = TokenHasher.Sha256Hex(dto.Token);
        var reset = await _context.PasswordResetTokens
            .FirstOrDefaultAsync(t => t.TokenHash == tokenHash && t.UsedAt == null && t.ExpiresAt > DateTime.UtcNow);

        if (reset == null)
            return ApiResponse.FailResult("Invalid or expired reset token.");

        var user = await _userManager.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == reset.UserId && !u.IsDeleted);

        if (user == null)
            return ApiResponse.FailResult("Invalid or expired reset token.");

        // Identity requires its own reset token; generate one and apply.
        var identityToken = await _userManager.GeneratePasswordResetTokenAsync(user);
        var result = await _userManager.ResetPasswordAsync(user, identityToken, dto.Password);
        if (!result.Succeeded)
            return ApiResponse.FailResult("Password reset failed.", result.Errors.Select(e => e.Description).ToList());

        reset.UsedAt = DateTime.UtcNow;
        user.IsFirstLogin = false;
        await _context.SaveChangesAsync();

        // Send confirmation email
        await _emailService.SendPasswordChangedEmailAsync(user.Email!);

        return ApiResponse.SuccessResult("Password reset successfully.");
    }

    private async Task<ApiResponse<AuthResponseDto>> CreateAuthResponseAsync(ApplicationUser user)
    {
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshTokenStr = _jwtService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = refreshTokenStr,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return ApiResponse<AuthResponseDto>.SuccessResult(new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshTokenStr,
            AccessTokenExpiry = DateTime.UtcNow.AddMinutes(60),
            User = new UserDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                Email = user.Email ?? string.Empty,
                Role = user.Role,
                CurrentTenantId = user.CurrentTenantId,
                IsFirstLogin = user.IsFirstLogin
            }
        });
    }
}
