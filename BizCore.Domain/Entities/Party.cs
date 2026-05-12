using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class Party : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public PartyType Type { get; set; }
    public decimal OpeningBalance { get; set; } = 0;

    public ICollection<KhataEntry> Entries { get; set; } = new List<KhataEntry>();
}
