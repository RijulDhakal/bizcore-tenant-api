using BizCore.Application.Interfaces;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Npgsql;

namespace BizCore.API.Controllers;

[ApiController]
[Authorize]
[Route("api/tenant/sales")]
public class TenantSalesController : ControllerBase
{
    private readonly ITenantDbConnectionFactory _tenantDb;

    public TenantSalesController(ITenantDbConnectionFactory tenantDb)
    {
        _tenantDb = tenantDb;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetRecentSales(CancellationToken cancellationToken)
    {
        try
        {
            await using var conn = await _tenantDb.OpenConnectionAsync(cancellationToken);

            const string sql = """
                SELECT \"Id\", \"CreatedAt\", \"TotalAmount\"
                FROM \"POSTransactions\"
                ORDER BY \"CreatedAt\" DESC
                LIMIT 50;
            """;

            await using var cmd = conn.CreateCommand();
            cmd.CommandText = sql;
            await using var reader = await cmd.ExecuteReaderAsync(cancellationToken);

            var rows = new List<object>();
            while (await reader.ReadAsync(cancellationToken))
            {
                rows.Add(new
                {
                    id = reader.GetGuid(0),
                    createdAt = reader.GetDateTime(1),
                    totalAmount = reader.GetDecimal(2),
                });
            }

            return Ok(ApiResponse<object>.SuccessResult(new { items = rows }));
        }
        catch (PostgresException ex) when (ex.SqlState == "42P01")
        {
            return StatusCode(500, ApiResponse<object>.FailResult(
                "Tenant database schema is missing required tables. Ensure migrations are applied to the tenant database.",
                new List<string> { ex.MessageText }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, ApiResponse<object>.FailResult("Failed to query tenant database.", new List<string> { ex.Message }));
        }
    }
}
