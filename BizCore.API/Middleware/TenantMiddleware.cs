using BizCore.Application.Interfaces;
using BizCore.Shared.Constants;

namespace BizCore.API.Middleware;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    public TenantMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context, ITenantService tenantService)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var tenantClaim =
                context.User.FindFirst("tenantId") ??
                context.User.FindFirst(ClaimTypes.TenantId);
            if (tenantClaim != null && Guid.TryParse(tenantClaim.Value, out var tenantId) && tenantId != Guid.Empty)
            {
                tenantService.SetTenantId(tenantId);
            }
        }

        var resolvedTenantId = tenantService.GetTenantId();
        Console.WriteLine($"[TenantMiddleware] Request: {context.Request.Path}, TenantId: {resolvedTenantId}");

        await _next(context);
    }
}
