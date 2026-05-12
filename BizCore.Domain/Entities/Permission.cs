namespace BizCore.Domain.Entities;

public class Permission : BaseEntity
{
    public string Code { get; set; } = string.Empty; // e.g., "Invoices.View", "POS.Create"
    public string ModuleCode { get; set; } = string.Empty; // e.g., "invoices", "pos"
    public string? Description { get; set; }
}

public class RolePermission : BaseEntity
{
    public string RoleName { get; set; } = string.Empty; // e.g., "Admin", "Accountant"
    public Guid PermissionId { get; set; }
    public virtual Permission Permission { get; set; } = null!;
}
