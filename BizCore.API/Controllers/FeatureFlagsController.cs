using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/feature-flags")]
[Authorize]
public class FeatureFlagsController : ControllerBase
{
    private readonly PlatformDbContext _platform;
    private readonly ITenantService _tenantService;

    public FeatureFlagsController(PlatformDbContext platform, ITenantService tenantService)
    {
        _platform = platform;
        _tenantService = tenantService;
    }

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var tenantId = _tenantService.GetTenantId();
        var data = await _platform.FeatureFlags
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.FeatureName)
            .ToListAsync();
        return Ok(new { success = true, data });
    }

    [HttpPost]
    [Authorize(Roles = "SuperAdmin,Owner,Admin")]
    public async Task<IActionResult> Create([FromBody] FeatureFlag dto)
    {
        dto.Id = Guid.NewGuid();
        dto.TenantId = _tenantService.GetTenantId();
        _platform.FeatureFlags.Add(dto);
        await _platform.SaveChangesAsync();
        return Ok(new { success = true, data = dto });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "SuperAdmin,Owner,Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] FeatureFlag dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var item = await _platform.FeatureFlags.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (item == null) return NotFound(new { success = false, message = "Feature flag not found" });

        item.FeatureName = dto.FeatureName;
        item.IsEnabled = dto.IsEnabled;
        item.EnabledForRoles = dto.EnabledForRoles;
        item.EnabledUntil = dto.EnabledUntil;
        item.Notes = dto.Notes;
        await _platform.SaveChangesAsync();

        return Ok(new { success = true, data = item });
    }
}
