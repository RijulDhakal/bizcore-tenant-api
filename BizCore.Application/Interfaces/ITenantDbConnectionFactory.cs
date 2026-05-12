using System.Data.Common;

namespace BizCore.Application.Interfaces;

public interface ITenantDbConnectionFactory
{
    Task<DbConnection> OpenConnectionAsync(CancellationToken cancellationToken = default);
}
