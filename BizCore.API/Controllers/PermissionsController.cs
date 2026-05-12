using BizCore.Application.Interfaces;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/permissions")]
[Authorize]
public class PermissionsController : ControllerBase
{
    private readonly IPermissionService _permissionService;
    private readonly ICurrentUserService _currentUserService;

    public PermissionsController(
        IPermissionService permissionService,
        ICurrentUserService currentUserService)
    {
        _permissionService = permissionService;
        _currentUserService = currentUserService;
    }

    /// <summary>
    /// Get permissions for the current logged-in user (role + permissions + enabled modules)
    /// </summary>
    [HttpGet("me")]
    public async Task<IActionResult> GetMyPermissions()
    {
        var userId = _currentUserService.UserId;
        var result = await _permissionService.GetUserPermissionsAsync(userId);
        return Ok(ApiResponse<object>.SuccessResult(result));
    }

    /// <summary>
    /// Check if current user has a specific permission
    /// </summary>
    [HttpGet("check/{permissionCode}")]
    public async Task<IActionResult> CheckPermission(string permissionCode)
    {
        var roleClaim = User.FindFirst("role")?.Value ?? "";
        var hasPermission = await _permissionService.HasPermissionAsync(roleClaim, permissionCode);
        return Ok(ApiResponse<object>.SuccessResult(hasPermission));
    }
}
