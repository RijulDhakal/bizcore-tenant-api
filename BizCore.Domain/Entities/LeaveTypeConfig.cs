using System.ComponentModel.DataAnnotations;

namespace BizCore.Domain.Entities;

// NOTE: This is named LeaveTypeConfig to avoid clashing with the existing LeaveType enum.
// It is mapped to the "LeaveTypes" table via the DbSet name in AppDbContext.
public class LeaveTypeConfig : TenantEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Code { get; set; }

    public int DaysPerYear { get; set; } = 0;
    public bool IsPaid { get; set; } = true;
    public bool CarryForward { get; set; } = false;
    public int MaxCarryForward { get; set; } = 0;
    public bool RequiresApproval { get; set; } = true;
}
