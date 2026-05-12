using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class Employee : TenantEntity
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string Position { get; set; } = string.Empty;
    public string? Department { get; set; }
    public string EmployeeCode { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public DateTime JoinDate { get; set; }
    public EmploymentType EmploymentType { get; set; }
    public EmployeeStatus Status { get; set; }
    public decimal BasicSalary { get; set; }
    public string? CitizenshipNumber { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankName { get; set; }
    public string? PANNumber { get; set; }
    public decimal HouseRentAllowance { get; set; } = 0;
    public decimal TransportAllowance { get; set; } = 0;
    public decimal MedicalAllowance { get; set; } = 0;
    public decimal DearnesAllowance { get; set; } = 0;
    public decimal PFDeductionPercent { get; set; } = 10;
    public decimal SSFDeductionPercent { get; set; } = 1;
    public bool IsTDSApplicable { get; set; } = false;
    public string? Address { get; set; }
    public string? EmergencyContactName { get; set; }
    public string? EmergencyContactPhone { get; set; }

    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<LeaveRequest> LeaveRequests { get; set; } = new List<LeaveRequest>();
    public ICollection<Payroll> Payrolls { get; set; } = new List<Payroll>();
}

public class Attendance : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public DateTime Date { get; set; }
    public TimeSpan? CheckIn { get; set; }
    public TimeSpan? CheckOut { get; set; }
    public AttendanceStatus Status { get; set; }
    public decimal WorkingHours { get; set; }
    public string? Notes { get; set; }
}

public class LeaveRequest : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public LeaveType LeaveType { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int TotalDays { get; set; }
    public string? Reason { get; set; }
    public LeaveStatus Status { get; set; }
    public Guid? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
}

public class Payroll : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public int Month { get; set; }
    public int Year { get; set; }
    public decimal BasicSalary { get; set; }
    public decimal Allowances { get; set; }
    public decimal Deductions { get; set; }
    public decimal NetSalary { get; set; }
    public PayrollStatus PaymentStatus { get; set; }
    public DateTime? PaymentDate { get; set; }
    public string? Notes { get; set; }
}

public class HRAssistanceRequest : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public string Category { get; set; } = "General"; // Leave, Attendance, Salary, General
    public string Subject { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, InProgress, Resolved, Rejected
    public string? Response { get; set; }
    public Guid? HandledBy { get; set; }
    public DateTime? HandledAt { get; set; }
}
