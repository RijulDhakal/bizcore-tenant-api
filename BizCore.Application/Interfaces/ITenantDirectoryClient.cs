using BizCore.Application.DTOs.Tenants;

namespace BizCore.Application.Interfaces;

public interface ITenantDirectoryClient
{
    Task<TenantProfileDto?> GetTenantProfileAsync(Guid tenantId, CancellationToken cancellationToken = default);
    Task<TenantProfileDto?> ResolveTenantBySlugAsync(string tenantSlug, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<TenantListItemDto>> ListTenantsAsync(CancellationToken cancellationToken = default);

    Task<bool> UpdateTenantOnboardingStatusAsync(Guid tenantId, string onboardingStatusJson, CancellationToken cancellationToken = default);
    Task<bool> UpdateTenantProfileAsync(Guid tenantId, UpdateTenantProfileDto update, CancellationToken cancellationToken = default);
}
