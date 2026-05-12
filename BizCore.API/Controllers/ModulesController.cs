using BizCore.Application.Interfaces;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/modules")]
[Authorize]
public class ModulesController : ControllerBase
{
    private readonly IModuleService _moduleService;
    private readonly ITenantService _tenantService;

    public ModulesController(IModuleService moduleService, ITenantService tenantService)
    {
        _moduleService = moduleService;
        _tenantService = tenantService;
    }

    /// <summary>
    /// Get all available modules (system-wide)
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var modules = await _moduleService.GetAllModulesAsync();
        return Ok(ApiResponse<object>.SuccessResult(modules));
    }

    /// <summary>
    /// Get modules for the current tenant (with enabled/disabled status)
    /// </summary>
    [HttpGet("tenant")]
    public async Task<IActionResult> GetForTenant()
    {
        var tenantId = _tenantService.GetTenantId();
        var modules = await _moduleService.GetModulesForTenantAsync(tenantId);
        return Ok(ApiResponse<object>.SuccessResult(modules));
    }

    /// <summary>
    /// Get modules for a specific tenant (SuperAdmin only)
    /// </summary>
    [HttpGet("tenant/{tenantId}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> GetForTenantById(Guid tenantId)
    {
        var modules = await _moduleService.GetModulesForTenantAsync(tenantId);
        return Ok(ApiResponse<object>.SuccessResult(modules));
    }

    /// <summary>
    /// Enable a module for the current tenant
    /// </summary>
    [HttpPatch("{code}/enable")]
    [Authorize(Roles = "SuperAdmin,Owner,Admin")]
    public async Task<IActionResult> Enable(string code)
    {
        var tenantId = _tenantService.GetTenantId();
        var result = await _moduleService.EnableModuleAsync(tenantId, code);
        return result
            ? Ok(ApiResponse.SuccessResult($"Module '{code}' enabled"))
            : NotFound(ApiResponse.FailResult($"Module '{code}' not found"));
    }

    /// <summary>
    /// Disable a module for the current tenant
    /// </summary>
    [HttpPatch("{code}/disable")]
    [Authorize(Roles = "SuperAdmin,Owner,Admin")]
    public async Task<IActionResult> Disable(string code)
    {
        var tenantId = _tenantService.GetTenantId();
        var result = await _moduleService.DisableModuleAsync(tenantId, code);
        return result
            ? Ok(ApiResponse.SuccessResult($"Module '{code}' disabled"))
            : NotFound(ApiResponse.FailResult($"Module '{code}' not found"));
    }

    /// <summary>
    /// Enable a module for a specific tenant (SuperAdmin only)
    /// </summary>
    [HttpPatch("{code}/enable/{tenantId}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> EnableForTenant(string code, Guid tenantId)
    {
        var result = await _moduleService.EnableModuleAsync(tenantId, code);
        return result
            ? Ok(ApiResponse.SuccessResult($"Module '{code}' enabled for tenant"))
            : NotFound(ApiResponse.FailResult($"Module '{code}' not found"));
    }

    /// <summary>
    /// Disable a module for a specific tenant (SuperAdmin only)
    /// </summary>
    [HttpPatch("{code}/disable/{tenantId}")]
    [Authorize(Roles = "SuperAdmin")]
    public async Task<IActionResult> DisableForTenant(string code, Guid tenantId)
    {
        var result = await _moduleService.DisableModuleAsync(tenantId, code);
        return result
            ? Ok(ApiResponse.SuccessResult($"Module '{code}' disabled for tenant"))
            : NotFound(ApiResponse.FailResult($"Module '{code}' not found"));
    }
}
