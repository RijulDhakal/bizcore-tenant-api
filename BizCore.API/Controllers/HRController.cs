using BizCore.API.Middleware;
using BizCore.Application.DTOs.HR;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[Authorize]
[RequireModule("hr")]
[RequirePermission("HR.View")]
[ApiController]
[Route("api/hr")]
public class HRController : ControllerBase
{
    private readonly IHRService _hrService;

    public HRController(IHRService hrService) => _hrService = hrService;

    // Employees
    [HttpGet("employees")]
    public async Task<IActionResult> GetEmployees(string? search, string? department, Guid? branchId)
        => Ok(await _hrService.GetEmployeesAsync(search, department, branchId));

    [HttpGet("employees/{id}")]
    public async Task<IActionResult> GetEmployee(Guid id) => Ok(await _hrService.GetEmployeeByIdAsync(id));

    [HttpPost("employees")]
    public async Task<IActionResult> CreateEmployee(CreateEmployeeDto dto) => Ok(await _hrService.CreateEmployeeAsync(dto));

    [HttpPut("employees/{id}")]
    public async Task<IActionResult> UpdateEmployee(Guid id, UpdateEmployeeDto dto) => Ok(await _hrService.UpdateEmployeeAsync(id, dto));

    [HttpDelete("employees/{id}")]
    public async Task<IActionResult> DeleteEmployee(Guid id) => Ok(await _hrService.DeleteEmployeeAsync(id));

    // Attendance
    [HttpGet("attendance")]
    public async Task<IActionResult> GetAttendance(Guid? employeeId, int? month, int? year)
        => Ok(await _hrService.GetAttendanceAsync(employeeId, month, year));

    [HttpPost("attendance")]
    public async Task<IActionResult> MarkAttendance(MarkAttendanceDto dto) => Ok(await _hrService.MarkAttendanceAsync(dto));

    [HttpPost("attendance/bulk")]
    public async Task<IActionResult> BulkMarkAttendance(BulkMarkAttendanceDto dto) => Ok(await _hrService.BulkMarkAttendanceAsync(dto));

    [HttpPut("attendance/{id}")]
    public async Task<IActionResult> UpdateAttendance(Guid id, MarkAttendanceDto dto) => Ok(await _hrService.UpdateAttendanceAsync(id, dto));

    // Leaves
    [HttpGet("leaves")]
    public async Task<IActionResult> GetLeaves(string? status, Guid? employeeId)
        => Ok(await _hrService.GetLeaveRequestsAsync(status, employeeId));

    [HttpPost("leaves")]
    public async Task<IActionResult> CreateLeave(CreateLeaveRequestDto dto) => Ok(await _hrService.CreateLeaveRequestAsync(dto));

    [HttpPost("leaves/{id}/approve")]
    public async Task<IActionResult> ApproveLeave(Guid id) => Ok(await _hrService.ApproveLeaveRequestAsync(id));

    [HttpPost("leaves/{id}/reject")]
    public async Task<IActionResult> RejectLeave(Guid id) => Ok(await _hrService.RejectLeaveRequestAsync(id));

    // Payroll
    [HttpGet("payroll")]
    public async Task<IActionResult> GetPayroll(int month, int year) => Ok(await _hrService.GetPayrollAsync(month, year));

    [HttpGet("payroll/summary")]
    public async Task<IActionResult> GetPayrollSummary(int month, int year) => Ok(await _hrService.GetPayrollSummaryAsync(month, year));

    [HttpPost("payroll/generate")]
    public async Task<IActionResult> GeneratePayroll(int month, int year) => Ok(await _hrService.GeneratePayrollAsync(month, year));

    [HttpPut("payroll/{id}")]
    public async Task<IActionResult> UpdatePayroll(Guid id, UpdatePayrollDto dto) => Ok(await _hrService.UpdatePayrollAsync(id, dto));

    [HttpPost("payroll/{id}/pay")]
    public async Task<IActionResult> PayPayroll(Guid id) => Ok(await _hrService.MarkPayrollAsPaidAsync(id));

    // HR Assistance Requests
    [HttpGet("assistance")]
    public async Task<IActionResult> GetAssistanceRequests(string? status, Guid? employeeId)
        => Ok(await _hrService.GetAssistanceRequestsAsync(status, employeeId));

    [HttpPost("assistance")]
    public async Task<IActionResult> CreateAssistanceRequest(CreateHRAssistanceRequestDto dto)
        => Ok(await _hrService.CreateAssistanceRequestAsync(dto));

    [HttpPost("assistance/{id}/resolve")]
    public async Task<IActionResult> ResolveAssistanceRequest(Guid id, ResolveHRAssistanceRequestDto dto)
        => Ok(await _hrService.ResolveAssistanceRequestAsync(id, dto));
}
