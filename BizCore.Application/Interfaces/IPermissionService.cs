namespace BizCore.Application.Interfaces;

public interface IPermissionService
{
    Task<List<string>> GetPermissionsForRoleAsync(string roleName);
    Task<bool> HasPermissionAsync(string roleName, string permissionCode);
    Task<UserPermissionsDto> GetUserPermissionsAsync(Guid userId);
}

public class UserPermissionsDto
{
    public string Role { get; set; } = string.Empty;
    public List<string> Permissions { get; set; } = new();
    public List<string> EnabledModules { get; set; } = new();
}
