using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Infrastructure.Data;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Application.Services;

public class PermissionService : IPermissionService
{
    private readonly PlatformDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IModuleService _moduleService;

    public PermissionService(
        PlatformDbContext context,
        UserManager<ApplicationUser> userManager,
        IModuleService moduleService)
    {
        _context = context;
        _userManager = userManager;
        _moduleService = moduleService;
    }

    public async Task<List<string>> GetPermissionsForRoleAsync(string roleName)
    {
        return await _context.RolePermissions
            .Where(rp => rp.RoleName == roleName && !rp.IsDeleted)
            .Include(rp => rp.Permission)
            .Select(rp => rp.Permission.Code)
            .ToListAsync();
    }

    public async Task<bool> HasPermissionAsync(string roleName, string permissionCode)
    {
        // Owner and SuperAdmin have full access
        if (roleName == "Owner" || roleName == "SuperAdmin")
            return true;

        return await _context.RolePermissions
            .AnyAsync(rp => rp.RoleName == roleName
                && !rp.IsDeleted
                && rp.Permission.Code.ToLower() == permissionCode.ToLower());
    }

    public async Task<UserPermissionsDto> GetUserPermissionsAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return new UserPermissionsDto();

        var roleName = user.Role.ToString();
        var permissions = await GetPermissionsForRoleAsync(roleName);

        // Get enabled modules for this tenant
        var enabledModules = new List<string>();
        if (user.CurrentTenantId.HasValue && user.CurrentTenantId != Guid.Empty)
        {
            var tenantModules = await _moduleService.GetModulesForTenantAsync(user.CurrentTenantId.Value);
            enabledModules = tenantModules.Where(m => m.IsEnabled).Select(m => m.Code).ToList();
        }

        // Owner/SuperAdmin get all permissions
        if (roleName == "Owner" || roleName == "SuperAdmin")
        {
            permissions = await _context.Permissions
                .Where(p => !p.IsDeleted)
                .Select(p => p.Code)
                .ToListAsync();
        }

        return new UserPermissionsDto
        {
            Role = roleName,
            Permissions = permissions,
            EnabledModules = enabledModules
        };
    }
}
