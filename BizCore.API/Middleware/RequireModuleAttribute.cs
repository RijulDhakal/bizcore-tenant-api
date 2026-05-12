using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using BizCore.Application.Interfaces;

namespace BizCore.API.Middleware;

/// <summary>
/// Attribute to require a specific module to be enabled for the current tenant.
/// Usage: [RequireModule("pos")]
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequireModuleAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _moduleCode;

    public RequireModuleAttribute(string moduleCode)
    {
        _moduleCode = moduleCode;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // SuperAdmin bypasses module checks in their management context
        // but for actual module usage, they should probably respect it if they are logged into a business.
        // For now, let's allow SuperAdmin to bypass.
        var roleClaim = user.FindFirst("role")?.Value;
        if (roleClaim == "SuperAdmin")
        {
            return;
        }

        var tenantService = context.HttpContext.RequestServices.GetRequiredService<ITenantService>();
        var moduleService = context.HttpContext.RequestServices.GetRequiredService<IModuleService>();
        
        var tenantId = tenantService.GetTenantId();
        var isEnabled = await moduleService.IsModuleEnabledAsync(tenantId, _moduleCode);

        if (!isEnabled)
        {
            context.Result = new JsonResult(new
            {
                success = false,
                message = $"The module '{_moduleCode}' is NOT enabled for this business."
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}
