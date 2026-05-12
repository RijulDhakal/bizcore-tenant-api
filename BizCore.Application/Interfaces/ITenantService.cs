namespace BizCore.Application.Interfaces;

public interface ITenantService
{
    Guid GetTenantId();
    void SetTenantId(Guid tenantId);
}
