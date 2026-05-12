namespace BizCore.Domain.Entities;

public class ContactKhataLink : BaseEntity
{
    public Guid TenantId { get; set; }
    public Guid ContactId { get; set; }
    public Guid KhataAccountId { get; set; }
    public DateTime LinkedAt { get; set; } = DateTime.UtcNow;

    public Contact Contact { get; set; } = null!;
    public Party KhataAccount { get; set; } = null!;
}