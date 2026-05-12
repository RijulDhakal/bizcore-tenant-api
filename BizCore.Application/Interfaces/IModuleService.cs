namespace BizCore.Application.Interfaces;

public interface IModuleService
{
    Task<List<ModuleDto>> GetAllModulesAsync();
    Task<List<ModuleDto>> GetModulesForTenantAsync(Guid tenantId);
    Task<bool> EnableModuleAsync(Guid tenantId, string moduleCode);
    Task<bool> DisableModuleAsync(Guid tenantId, string moduleCode);
    Task<bool> IsModuleEnabledAsync(Guid tenantId, string moduleCode);
}

public class ModuleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Icon { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; }
    public bool IsEnabled { get; set; } // Whether this tenant has it enabled
    public bool IsCore { get; set; }
}
