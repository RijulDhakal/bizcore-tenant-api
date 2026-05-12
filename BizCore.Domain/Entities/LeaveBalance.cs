using System.ComponentModel.DataAnnotations;

namespace BizCore.Domain.Entities;

public class LeaveBalance : TenantEntity
{
    [Required]
    public Guid EmployeeId { get; set; }

    [Required]
    public Guid LeaveTypeId { get; set; }

    public int Year { get; set; }

    public decimal TotalDays { get; set; }
    public decimal UsedDays { get; set; }
    public decimal PendingDays { get; set; }
    public decimal CarriedForward { get; set; }

    public Employee? Employee { get; set; }
    public LeaveTypeConfig? LeaveType { get; set; }
}
