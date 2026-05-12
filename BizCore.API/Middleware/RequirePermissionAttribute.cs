using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using BizCore.Application.Interfaces;
using BizCore.Domain.Enums;

namespace BizCore.API.Middleware;

/// <summary>
/// Attribute to require a specific permission on a controller action.
/// Usage: [RequirePermission("Invoices.Create")]
/// </summary>
[AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
public class RequirePermissionAttribute : Attribute, IAsyncAuthorizationFilter
{
    private readonly string _permissionCode;

    public RequirePermissionAttribute(string permissionCode)
    {
        _permissionCode = permissionCode;
    }

    public async Task OnAuthorizationAsync(AuthorizationFilterContext context)
    {
        var user = context.HttpContext.User;

        if (user.Identity?.IsAuthenticated != true)
        {
            context.Result = new UnauthorizedResult();
            return;
        }

        // Get role from claims
        var roleClaim = user.FindFirst("role")?.Value;
        if (string.IsNullOrEmpty(roleClaim))
        {
            context.Result = new ForbidResult();
            return;
        }

        // Owner and SuperAdmin bypass permission checks
        if (roleClaim == "Owner" || roleClaim == "SuperAdmin" ||
            roleClaim == nameof(UserRole.Owner) || roleClaim == nameof(UserRole.SuperAdmin))
        {
            return;
        }

        var permissionService = context.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
        var hasPermission = await permissionService.HasPermissionAsync(roleClaim, _permissionCode);

        if (!hasPermission)
        {
            context.Result = new JsonResult(new
            {
                success = false,
                message = $"You do not have permission: {_permissionCode}"
            })
            {
                StatusCode = StatusCodes.Status403Forbidden
            };
        }
    }
}
