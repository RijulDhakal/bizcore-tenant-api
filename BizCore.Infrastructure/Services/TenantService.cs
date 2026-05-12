using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Http;

namespace BizCore.Infrastructure.Services;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private Guid _tenantId = Guid.Empty;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid GetTenantId()
    {
        var context = _httpContextAccessor.HttpContext;

        if (context?.User?.Identity?.IsAuthenticated != true)
        {
            return Guid.Empty;
        }

        var tidValue =
            context.User.FindFirst("tid")?.Value ??
            context.User.FindFirst("tenantId")?.Value ??
            context.User.FindFirst("TenantId")?.Value ??
            context.User.FindFirst("tenant_id")?.Value;

        if (string.IsNullOrEmpty(tidValue))
        {
            var claims = string.Join(" | ", context.User.Claims.Select(c => $"{c.Type}={c.Value}"));
            Console.WriteLine($"[Tenant] No tid claim. Claims: {claims}");
            return Guid.Empty;
        }

        if (Guid.TryParse(tidValue, out var tenantId))
        {
            _tenantId = tenantId;
            Console.WriteLine($"[Tenant] TenantId: {tenantId}");
            return tenantId;
        }

        return Guid.Empty;
    }

    public void SetTenantId(Guid tenantId) => _tenantId = tenantId;
}
