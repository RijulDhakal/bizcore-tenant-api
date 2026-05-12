using BizCore.Application.DTOs.Tenants;
using BizCore.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;

namespace BizCore.Infrastructure.Services;

public sealed class SuperAdminApiTenantDirectoryClient : ITenantDirectoryClient
{
    private readonly HttpClient _http;
    private readonly IConfiguration _configuration;

    public SuperAdminApiTenantDirectoryClient(HttpClient http, IConfiguration configuration)
    {
        _http = http;
        _configuration = configuration;
    }

    private Uri GetBaseUri()
    {
        var baseUrl = _configuration["SuperAdminApi:BaseUrl"];
        if (string.IsNullOrWhiteSpace(baseUrl))
            throw new InvalidOperationException("SuperAdmin API base URL is not configured (SuperAdminApi:BaseUrl).");

        if (!Uri.TryCreate(baseUrl, UriKind.Absolute, out var uri))
            throw new InvalidOperationException("SuperAdminApi:BaseUrl must be an absolute URL.");

        return uri;
    }

    private HttpClient WithBaseAddress()
    {
        var baseUri = GetBaseUri();
        if (_http.BaseAddress == null || _http.BaseAddress != baseUri)
            _http.BaseAddress = baseUri;
        return _http;
    }

    public async Task<TenantProfileDto?> GetTenantProfileAsync(Guid tenantId, CancellationToken cancellationToken = default)
    {
        var http = WithBaseAddress();
        var resp = await http.GetAsync($"/api/tenants/{tenantId}/profile", cancellationToken);
        if (resp.StatusCode == System.Net.HttpStatusCode.NotFound) return null;
        resp.EnsureSuccessStatusCode();
        return await resp.Content.ReadFromJsonAsync<TenantProfileDto>(cancellationToken);
    }

    public async Task<TenantProfileDto?> ResolveTenantBySlugAsync(string tenantSlug, CancellationToken cancellationToken = default)
    {
        var http = WithBaseAddress();
        var resp = await http.GetAsync($"/api/tenants/resolve?slug={Uri.EscapeDataString(tenantSlug)}", cancellationToken);
        if (resp.StatusCode == System.Net.HttpStatusCode.NotFound) return null;
        resp.EnsureSuccessStatusCode();
        return await resp.Content.ReadFromJsonAsync<TenantProfileDto>(cancellationToken);
    }

    public async Task<IReadOnlyList<TenantListItemDto>> ListTenantsAsync(CancellationToken cancellationToken = default)
    {
        var http = WithBaseAddress();
        var resp = await http.GetAsync("/api/tenants", cancellationToken);
        resp.EnsureSuccessStatusCode();
        var data = await resp.Content.ReadFromJsonAsync<List<TenantListItemDto>>(cancellationToken);
        return data ?? [];
    }

    public async Task<bool> UpdateTenantOnboardingStatusAsync(Guid tenantId, string onboardingStatusJson, CancellationToken cancellationToken = default)
    {
        var http = WithBaseAddress();
        var resp = await http.PutAsJsonAsync($"/api/tenants/{tenantId}/onboarding", new { onboardingStatusJson }, cancellationToken);
        if (!resp.IsSuccessStatusCode) return false;
        return true;
    }

    public async Task<bool> UpdateTenantProfileAsync(Guid tenantId, UpdateTenantProfileDto update, CancellationToken cancellationToken = default)
    {
        var http = WithBaseAddress();
        var resp = await http.PutAsJsonAsync($"/api/tenants/{tenantId}/profile", update, cancellationToken);
        if (!resp.IsSuccessStatusCode) return false;
        return true;
    }
}
