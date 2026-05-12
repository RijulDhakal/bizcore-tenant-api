namespace BizCore.Domain.Entities;

public class Module : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Icon { get; set; }
    public int SortOrder { get; set; } = 0;
    public bool IsCore { get; set; } = false;
}

public class TenantModule : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid ModuleId { get; set; }
    public bool IsEnabled { get; set; } = true;
    public virtual Module Module { get; set; } = null!;
}
