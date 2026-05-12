using System;
using System.Security.Claims;
using BizCore.Application.Interfaces;
using BizCore.Shared.Constants;
using Microsoft.AspNetCore.Http;
using System.IdentityModel.Tokens.Jwt;

namespace BizCore.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid UserId
    {
        get
        {
            var principal = _httpContextAccessor.HttpContext?.User;
            var id = principal?.FindFirstValue(ClaimTypes.UserId)
                ?? principal?.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier)
                ?? principal?.FindFirstValue(JwtRegisteredClaimNames.Sub);

            return id != null && Guid.TryParse(id, out var parsed) ? parsed : Guid.Empty;
        }
    }

    public Guid TenantId
    {
        get
        {
            var principal = _httpContextAccessor.HttpContext?.User;
            var id = principal?.FindFirstValue(ClaimTypes.TenantId)
                ?? principal?.FindFirstValue("tenantId");

            return id != null && Guid.TryParse(id, out var parsed) ? parsed : Guid.Empty;
        }
    }

    public string? Email
        => _httpContextAccessor.HttpContext?.User?.FindFirstValue(ClaimTypes.Email)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue(JwtRegisteredClaimNames.Email)
        ?? _httpContextAccessor.HttpContext?.User?.FindFirstValue(System.Security.Claims.ClaimTypes.Email);

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}

public static class ClaimTypes
{
    public const string UserId = BizCore.Shared.Constants.ClaimTypes.UserId;
    public const string TenantId = BizCore.Shared.Constants.ClaimTypes.TenantId;
    public const string Role = BizCore.Shared.Constants.ClaimTypes.Role;
    public const string Email = BizCore.Shared.Constants.ClaimTypes.Email;
}
