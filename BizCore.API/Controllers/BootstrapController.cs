using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/bootstrap")]
[Authorize]
public class BootstrapController : ControllerBase
{
    private readonly ICurrentUserService _currentUserService;
    private readonly IPermissionService _permissionService;
    private readonly IModuleService _moduleService;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly AppDbContext _context;
    private readonly ITenantDirectoryClient _tenantDirectory;
    private readonly ILogger<BootstrapController> _logger;

    public BootstrapController(
        ICurrentUserService currentUserService,
        IPermissionService permissionService,
        IModuleService moduleService,
        UserManager<ApplicationUser> userManager,
        AppDbContext context,
        ITenantDirectoryClient tenantDirectory,
        ILogger<BootstrapController> logger)
    {
        _currentUserService = currentUserService;
        _permissionService = permissionService;
        _moduleService = moduleService;
        _userManager = userManager;
        _context = context;
        _tenantDirectory = tenantDirectory;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> Get()
    {
        var sw = Stopwatch.StartNew();

        var userId = _currentUserService.UserId;
        if (userId == Guid.Empty)
        {
            _logger.LogWarning("Bootstrap failed: missing user claim. Email={Email}", _currentUserService.Email);
            return Unauthorized(ApiResponse<object>.FailResult("User not authenticated."));
        }

        var user = await _userManager.Users
            .AsNoTracking()
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Id == userId && !u.IsDeleted);

        if (user == null)
        {
            _logger.LogWarning("Bootstrap failed: user {UserId} not found", userId);
            return NotFound(ApiResponse<object>.FailResult("User not found."));
        }

        var permissions = await _permissionService.GetUserPermissionsAsync(user.Id);

        List<ModuleDto> modules = new();
        BizCore.Application.DTOs.Tenants.TenantProfileDto? business = null;
        if (user.CurrentTenantId.HasValue && user.CurrentTenantId.Value != Guid.Empty)
        {
            var modulesTask = _moduleService.GetModulesForTenantAsync(user.CurrentTenantId.Value);
            var businessTask = _tenantDirectory.GetTenantProfileAsync(user.CurrentTenantId.Value);

            await Task.WhenAll(modulesTask, businessTask);
            modules = modulesTask.Result;
            business = businessTask.Result;
        }

        sw.Stop();
        if (sw.ElapsedMilliseconds > 300)
        {
            _logger.LogWarning(
                "Slow bootstrap response for user {UserId}: {ElapsedMs}ms",
                user.Id,
                sw.ElapsedMilliseconds);
        }

        return Ok(ApiResponse<object>.SuccessResult(new
        {
            user = new
            {
                id = user.Id,
                firstName = user.FirstName,
                lastName = user.LastName,
                email = user.Email,
                role = (int)user.Role,
                roleName = user.Role.ToString(),
                currentTenantId = user.CurrentTenantId,
                isFirstLogin = user.IsFirstLogin,
            },
            role = permissions.Role,
            permissions = permissions.Permissions ?? new List<string>(),
            enabledModules = permissions.EnabledModules ?? new List<string>(),
            modules = modules ?? new List<ModuleDto>(),
            business
        }));
    }
}
