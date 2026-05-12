using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Application.Services;

public class ModuleService : IModuleService
{
    private readonly PlatformDbContext _context;

    public ModuleService(PlatformDbContext context)
    {
        _context = context;
    }

    public async Task<List<ModuleDto>> GetAllModulesAsync()
    {
        return await _context.Modules
            .Where(m => !m.IsDeleted && m.IsActive)
            .OrderBy(m => m.SortOrder)
            .Select(m => new ModuleDto
            {
                Id = m.Id,
                Name = m.Name,
                Code = m.Code,
                Description = m.Description,
                Icon = m.Icon,
                SortOrder = m.SortOrder,
                IsActive = m.IsActive,
                IsEnabled = m.IsCore, // Core modules are always enabled
                IsCore = m.IsCore
            })
            .ToListAsync();
    }

    public async Task<List<ModuleDto>> GetModulesForTenantAsync(Guid tenantId)
    {
        var modules = await _context.Modules
            .Where(m => !m.IsDeleted && m.IsActive)
            .OrderBy(m => m.SortOrder)
            .ToListAsync();

        var tenantModules = await _context.TenantModules
            .Where(tm => !tm.IsDeleted && tm.TenantId == tenantId)
            .ToListAsync();

        return modules.Select(m => new ModuleDto
        {
            Id = m.Id,
            Name = m.Name,
            Code = m.Code,
            Description = m.Description,
            Icon = m.Icon,
            SortOrder = m.SortOrder,
            IsActive = m.IsActive,
            IsEnabled = m.IsCore || tenantModules.Any(tm => tm.ModuleId == m.Id && tm.IsEnabled),
            IsCore = m.IsCore
        }).ToList();
    }

    public async Task<bool> EnableModuleAsync(Guid tenantId, string moduleCode)
    {
        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Code == moduleCode && !m.IsDeleted);
        if (module == null) return false;

        var tenantModule = await _context.TenantModules
            .FirstOrDefaultAsync(tm => tm.TenantId == tenantId && tm.ModuleId == module.Id && !tm.IsDeleted);

        if (tenantModule != null)
        {
            tenantModule.IsEnabled = true;
        }
        else
        {
            _context.TenantModules.Add(new TenantModule
            {
                TenantId = tenantId,
                ModuleId = module.Id,
                IsEnabled = true
            });
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> DisableModuleAsync(Guid tenantId, string moduleCode)
    {
        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Code == moduleCode && !m.IsDeleted);
        if (module == null) return false;
        if (module.IsCore) return true;

        var tenantModule = await _context.TenantModules
            .FirstOrDefaultAsync(tm => tm.TenantId == tenantId && tm.ModuleId == module.Id && !tm.IsDeleted);

        if (tenantModule != null)
        {
            tenantModule.IsEnabled = false;
            await _context.SaveChangesAsync();
        }

        return true;
    }

    public async Task<bool> IsModuleEnabledAsync(Guid tenantId, string moduleCode)
    {
        var module = await _context.Modules.FirstOrDefaultAsync(m => m.Code == moduleCode && !m.IsDeleted);
        if (module == null) return false;
        if (module.IsCore) return true; // Core modules are always enabled

        return await _context.TenantModules
            .AnyAsync(tm => tm.TenantId == tenantId && tm.ModuleId == module.Id && tm.IsEnabled && !tm.IsDeleted);
    }
}
