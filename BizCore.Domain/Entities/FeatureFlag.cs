namespace BizCore.Domain.Entities;

public class FeatureFlag : TenantEntity
{
    public string FeatureName { get; set; } = string.Empty;
    public bool IsEnabled { get; set; } = true;
    public string? EnabledForRoles { get; set; }
    public DateTime? EnabledUntil { get; set; }
    public string? Notes { get; set; }
}
