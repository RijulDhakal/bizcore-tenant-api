using BizCore.Application.Interfaces;
using BizCore.Infrastructure.Data;
using BizCore.Infrastructure.Services.Helpers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Npgsql;
using System.Data.Common;

namespace BizCore.Infrastructure.Services;

public class TenantDbConnectionFactory : ITenantDbConnectionFactory
{
    private readonly IConfiguration _config;
    private readonly ITenantDirectoryClient _tenantDirectory;
    private readonly ICurrentUserService _currentUser;

    public TenantDbConnectionFactory(IConfiguration config, ITenantDirectoryClient tenantDirectory, ICurrentUserService currentUser)
    {
        _config = config;
        _tenantDirectory = tenantDirectory;
        _currentUser = currentUser;
    }

    public async Task<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken = default)
    {
        if (!_currentUser.IsAuthenticated)
            throw new InvalidOperationException("User is not authenticated.");

        if (_currentUser.TenantId == Guid.Empty)
            throw new InvalidOperationException("TenantId missing in token.");

        var tenant = await _tenantDirectory.GetTenantProfileAsync(_currentUser.TenantId, cancellationToken);
        if (tenant == null)
            throw new InvalidOperationException("Tenant not found.");

        var slug = SlugHelper.Slugify(tenant.Name);
        if (string.IsNullOrWhiteSpace(slug))
            throw new InvalidOperationException("Tenant slug could not be derived.");

        var tenantDbName = $"{slug.Replace('-', '_')}_db";

        var baseConnStr =
            _config.GetConnectionString("MainConnection") ??
            _config.GetConnectionString("DefaultConnection");

        if (string.IsNullOrWhiteSpace(baseConnStr))
            throw new InvalidOperationException("Main database connection string is not configured.");

        var builder = new NpgsqlConnectionStringBuilder(baseConnStr)
        {
            Database = tenantDbName
        };

        var conn = new NpgsqlConnection(builder.ConnectionString);
        await conn.OpenAsync(cancellationToken);
        return conn;
    }
}
