using BizCore.Domain.Enums;

namespace BizCore.Application.DTOs.HR;

public record EmployeeDto(
    Guid Id,
    string FirstName,
    string LastName,
    string? Email,
    string? Phone,
    string Position,
    string? Department,
    string EmployeeCode,
    DateTime JoinDate,
    EmploymentType EmploymentType,
    EmployeeStatus Status,
    decimal BasicSalary,
    string? CitizenshipNumber,
    string? BankAccountNumber,
    string? BankName,
    string? PANNumber,
    decimal HouseRentAllowance,
    decimal TransportAllowance,
    decimal MedicalAllowance,
    decimal DearnesAllowance,
    decimal PFDeductionPercent,
    decimal SSFDeductionPercent,
    bool IsTDSApplicable,
    string? Address,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    Guid? UserId);

public record CreateEmployeeDto(
    string FirstName,
    string LastName,
    string? Email,
    string? Phone,
    string Position,
    string? Department,
    DateTime JoinDate,
    EmploymentType EmploymentType,
    decimal BasicSalary,
    string? CitizenshipNumber,
    string? BankAccountNumber,
    string? BankName,
    string? PANNumber,
    decimal HouseRentAllowance,
    decimal TransportAllowance,
    decimal MedicalAllowance,
    decimal DearnesAllowance,
    decimal PFDeductionPercent,
    decimal SSFDeductionPercent,
    bool IsTDSApplicable,
    string? Address,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    Guid? UserId = null);

public record UpdateEmployeeDto(
    string FirstName,
    string LastName,
    string? Email,
    string? Phone,
    string Position,
    string? Department,
    EmploymentType EmploymentType,
    EmployeeStatus Status,
    decimal BasicSalary,
    string? CitizenshipNumber,
    string? BankAccountNumber,
    string? BankName,
    string? PANNumber,
    decimal HouseRentAllowance,
    decimal TransportAllowance,
    decimal MedicalAllowance,
    decimal DearnesAllowance,
    decimal PFDeductionPercent,
    decimal SSFDeductionPercent,
    bool IsTDSApplicable,
    string? Address,
    string? EmergencyContactName,
    string? EmergencyContactPhone,
    Guid? UserId = null);

public record AttendanceDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    DateTime Date,
    TimeSpan? CheckIn,
    TimeSpan? CheckOut,
    AttendanceStatus Status,
    decimal WorkingHours,
    string? Notes);

public record MarkAttendanceDto(
    Guid EmployeeId,
    DateTime Date,
    TimeSpan? CheckIn,
    TimeSpan? CheckOut,
    AttendanceStatus Status,
    string? Notes);

public record BulkMarkAttendanceDto(
    DateTime Date,
    List<Guid> EmployeeIds,
    AttendanceStatus Status);

public record LeaveRequestDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    LeaveType LeaveType,
    DateTime StartDate,
    DateTime EndDate,
    int TotalDays,
    string? Reason,
    LeaveStatus Status,
    Guid? ApprovedBy,
    string? ApprovedByName,
    DateTime? ApprovedAt);

public record CreateLeaveRequestDto(
    Guid? EmployeeId,
    LeaveType LeaveType,
    DateTime StartDate,
    DateTime EndDate,
    string? Reason);

public record PayrollDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    int Month,
    int Year,
    decimal BasicSalary,
    decimal Allowances,
    decimal Deductions,
    decimal NetSalary,
    PayrollStatus PaymentStatus,
    DateTime? PaymentDate,
    string? Notes);

public record UpdatePayrollDto(
    decimal Allowances,
    decimal Deductions,
    string? Notes);

public record PayrollSummaryDto(
    decimal TotalPayrollCost,
    int PaidCount,
    int PendingCount);

public record HRAssistanceRequestDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    string Category,
    string Subject,
    string Message,
    string Status,
    string? Response,
    DateTime CreatedAt,
    DateTime? HandledAt,
    string? HandledByName);

public record CreateHRAssistanceRequestDto(
    string Category,
    string Subject,
    string Message);

public record ResolveHRAssistanceRequestDto(
    string Response,
    string Status);
