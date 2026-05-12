using BizCore.Application.DTOs.HR;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IHRService
{
    // Employees
    Task<ApiResponse<EmployeeDto>> CreateEmployeeAsync(CreateEmployeeDto dto);
    Task<ApiResponse<List<EmployeeDto>>> GetEmployeesAsync(string? search, string? department, Guid? branchId);
    Task<ApiResponse<EmployeeDto>> GetEmployeeByIdAsync(Guid id);
    Task<ApiResponse<EmployeeDto>> UpdateEmployeeAsync(Guid id, UpdateEmployeeDto dto);
    Task<ApiResponse<bool>> DeleteEmployeeAsync(Guid id);

    // Attendance
    Task<ApiResponse<AttendanceDto>> MarkAttendanceAsync(MarkAttendanceDto dto);
    Task<ApiResponse<bool>> BulkMarkAttendanceAsync(BulkMarkAttendanceDto dto);
    Task<ApiResponse<List<AttendanceDto>>> GetAttendanceAsync(Guid? employeeId, int? month, int? year);
    Task<ApiResponse<AttendanceDto>> UpdateAttendanceAsync(Guid id, MarkAttendanceDto dto);
    Task<ApiResponse<List<AttendanceDto>>> GetMyAttendanceAsync(int? month, int? year);

    // Leave Requests
    Task<ApiResponse<LeaveRequestDto>> CreateLeaveRequestAsync(CreateLeaveRequestDto dto);
    Task<ApiResponse<List<LeaveRequestDto>>> GetLeaveRequestsAsync(string? status, Guid? employeeId);
    Task<ApiResponse<LeaveRequestDto>> GetLeaveRequestByIdAsync(Guid id);
    Task<ApiResponse<bool>> ApproveLeaveRequestAsync(Guid id);
    Task<ApiResponse<bool>> RejectLeaveRequestAsync(Guid id);
    Task<ApiResponse<List<LeaveRequestDto>>> GetMyLeaveRequestsAsync(string? status);
    Task<ApiResponse<bool>> CancelMyLeaveRequestAsync(Guid id);

    // Payroll
    Task<ApiResponse<bool>> GeneratePayrollAsync(int month, int year);
    Task<ApiResponse<List<PayrollDto>>> GetPayrollAsync(int month, int year);
    Task<ApiResponse<PayrollDto>> GetPayrollByIdAsync(Guid id);
    Task<ApiResponse<PayrollDto>> UpdatePayrollAsync(Guid id, UpdatePayrollDto dto);
    Task<ApiResponse<bool>> MarkPayrollAsPaidAsync(Guid id);
    Task<ApiResponse<PayrollSummaryDto>> GetPayrollSummaryAsync(int month, int year);
    Task<ApiResponse<List<PayrollDto>>> GetMyPayslipsAsync();

    // HR Assistance Requests
    Task<ApiResponse<HRAssistanceRequestDto>> CreateAssistanceRequestAsync(CreateHRAssistanceRequestDto dto);
    Task<ApiResponse<List<HRAssistanceRequestDto>>> GetAssistanceRequestsAsync(string? status, Guid? employeeId);
    Task<ApiResponse<List<HRAssistanceRequestDto>>> GetMyAssistanceRequestsAsync(string? status);
    Task<ApiResponse<bool>> ResolveAssistanceRequestAsync(Guid id, ResolveHRAssistanceRequestDto dto);
}
