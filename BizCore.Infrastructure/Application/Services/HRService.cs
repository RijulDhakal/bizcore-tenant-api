using System.Linq;
using BizCore.Application.DTOs.HR;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Services;

public class HRService : IHRService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUserService;

    public HRService(AppDbContext context, ITenantService tenantService, ICurrentUserService currentUserService)
    {
        _context = context;
        _tenantService = tenantService;
        _currentUserService = currentUserService;
    }

    public async Task<ApiResponse<EmployeeDto>> CreateEmployeeAsync(CreateEmployeeDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var employeeCode = await GenerateEmployeeCodeAsync(tenantId);
        var employee = new Employee
        {
            TenantId = tenantId,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            Position = dto.Position,
            Department = dto.Department,
            EmployeeCode = employeeCode,
            JoinDate = dto.JoinDate,
            EmploymentType = dto.EmploymentType,
            Status = EmployeeStatus.Active,
            BasicSalary = dto.BasicSalary,
            CitizenshipNumber = dto.CitizenshipNumber,
            BankAccountNumber = dto.BankAccountNumber,
            BankName = dto.BankName,
            PANNumber = dto.PANNumber,
            HouseRentAllowance = dto.HouseRentAllowance,
            TransportAllowance = dto.TransportAllowance,
            MedicalAllowance = dto.MedicalAllowance,
            DearnesAllowance = dto.DearnesAllowance,
            PFDeductionPercent = dto.PFDeductionPercent,
            SSFDeductionPercent = dto.SSFDeductionPercent,
            IsTDSApplicable = dto.IsTDSApplicable,
            Address = dto.Address,
            EmergencyContactName = dto.EmergencyContactName,
            EmergencyContactPhone = dto.EmergencyContactPhone,
            UserId = dto.UserId
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return ApiResponse<EmployeeDto>.SuccessResult(MapEmployee(employee), "Employee created.");
    }

    public async Task<ApiResponse<List<EmployeeDto>>> GetEmployeesAsync(string? search, string? department, Guid? branchId)
    {
        var query = _context.Employees.AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            search = search.ToLower();
            query = query.Where(e => e.FirstName.ToLower().Contains(search) || 
                                   e.LastName.ToLower().Contains(search) || 
                                   e.EmployeeCode.ToLower().Contains(search));
        }

        if (!string.IsNullOrEmpty(department))
            query = query.Where(e => e.Department == department);

        var employees = await query.OrderBy(e => e.LastName).ToListAsync();
        return ApiResponse<List<EmployeeDto>>.SuccessResult(employees.Select(MapEmployee).ToList());
    }

    public async Task<ApiResponse<EmployeeDto>> GetEmployeeByIdAsync(Guid id)
    {
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return ApiResponse<EmployeeDto>.FailResult("Employee not found.");
        return ApiResponse<EmployeeDto>.SuccessResult(MapEmployee(employee));
    }

    public async Task<ApiResponse<EmployeeDto>> UpdateEmployeeAsync(Guid id, UpdateEmployeeDto dto)
    {
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return ApiResponse<EmployeeDto>.FailResult("Employee not found.");

        employee.FirstName = dto.FirstName;
        employee.LastName = dto.LastName;
        employee.Email = dto.Email;
        employee.Phone = dto.Phone;
        employee.Position = dto.Position;
        employee.Department = dto.Department;
        employee.EmploymentType = dto.EmploymentType;
        employee.Status = dto.Status;
        employee.BasicSalary = dto.BasicSalary;
        employee.CitizenshipNumber = dto.CitizenshipNumber;
        employee.BankAccountNumber = dto.BankAccountNumber;
        employee.BankName = dto.BankName;
        employee.PANNumber = dto.PANNumber;
        employee.HouseRentAllowance = dto.HouseRentAllowance;
        employee.TransportAllowance = dto.TransportAllowance;
        employee.MedicalAllowance = dto.MedicalAllowance;
        employee.DearnesAllowance = dto.DearnesAllowance;
        employee.PFDeductionPercent = dto.PFDeductionPercent;
        employee.SSFDeductionPercent = dto.SSFDeductionPercent;
        employee.IsTDSApplicable = dto.IsTDSApplicable;
        employee.Address = dto.Address;
        employee.EmergencyContactName = dto.EmergencyContactName;
        employee.EmergencyContactPhone = dto.EmergencyContactPhone;
        employee.UserId = dto.UserId;

        await _context.SaveChangesAsync();
        return ApiResponse<EmployeeDto>.SuccessResult(MapEmployee(employee), "Employee updated.");
    }

    public async Task<ApiResponse<bool>> DeleteEmployeeAsync(Guid id)
    {
        var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (employee == null) return ApiResponse<bool>.FailResult("Employee not found.");
        employee.IsDeleted = true;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Employee deleted.");
    }

    public async Task<ApiResponse<AttendanceDto>> MarkAttendanceAsync(MarkAttendanceDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var attendance = await _context.Attendances
            .FirstOrDefaultAsync(a => a.EmployeeId == dto.EmployeeId && a.Date.Date == dto.Date.Date);

        if (attendance == null)
        {
            attendance = new Attendance { TenantId = tenantId, EmployeeId = dto.EmployeeId, Date = dto.Date.Date };
            _context.Attendances.Add(attendance);
        }

        attendance.CheckIn = dto.CheckIn;
        attendance.CheckOut = dto.CheckOut;
        attendance.Status = dto.Status;
        attendance.Notes = dto.Notes;

        if (dto.CheckIn.HasValue && dto.CheckOut.HasValue)
        {
            var diff = dto.CheckOut.Value - dto.CheckIn.Value;
            attendance.WorkingHours = (decimal)diff.TotalHours;
        }
        else
        {
            attendance.WorkingHours = 0;
        }

        await _context.SaveChangesAsync();
        return ApiResponse<AttendanceDto>.SuccessResult(MapAttendance(attendance), "Attendance marked.");
    }

    public async Task<ApiResponse<bool>> BulkMarkAttendanceAsync(BulkMarkAttendanceDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        foreach (var employeeId in dto.EmployeeIds)
        {
            var attendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.Date.Date == dto.Date.Date);

            if (attendance == null)
            {
                attendance = new Attendance { TenantId = tenantId, EmployeeId = employeeId, Date = dto.Date.Date };
                _context.Attendances.Add(attendance);
            }

            attendance.Status = dto.Status;
            if (dto.Status == AttendanceStatus.Present)
            {
                attendance.CheckIn = new TimeSpan(9, 0, 0);
                attendance.CheckOut = new TimeSpan(17, 0, 0);
                attendance.WorkingHours = 8;
            }
            else
            {
                attendance.CheckIn = null;
                attendance.CheckOut = null;
                attendance.WorkingHours = 0;
            }
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Bulk attendance marked.");
    }

    public async Task<ApiResponse<List<AttendanceDto>>> GetAttendanceAsync(Guid? employeeId, int? month, int? year)
    {
        var query = _context.Attendances.Include(a => a.Employee).AsQueryable();
        
        // Role-based security check
        var isAdmin = await IsAdminUser();
        if (!isAdmin)
        {
            var empId = await GetCurrentEmployeeId();
            if (empId == null) return ApiResponse<List<AttendanceDto>>.SuccessResult(new List<AttendanceDto>());
            query = query.Where(a => a.EmployeeId == empId.Value);
        }
        else if (employeeId.HasValue) 
            query = query.Where(a => a.EmployeeId == employeeId.Value);
            
        if (month.HasValue) query = query.Where(a => a.Date.Month == month.Value);
        if (year.HasValue) query = query.Where(a => a.Date.Year == year.Value);

        var list = await query.ToListAsync();
        return ApiResponse<List<AttendanceDto>>.SuccessResult(list.Select(MapAttendance).ToList());
    }

    public async Task<ApiResponse<List<AttendanceDto>>> GetMyAttendanceAsync(int? month, int? year)
    {
        var (empId, employeeName) = await GetCurrentEmployeeContext();
        if (empId == null)
            return ApiResponse<List<AttendanceDto>>.SuccessResult(new List<AttendanceDto>());

        var query = _context.Attendances
            .Where(a => a.EmployeeId == empId.Value);

        if (month.HasValue) query = query.Where(a => a.Date.Month == month.Value);
        if (year.HasValue) query = query.Where(a => a.Date.Year == year.Value);

        var list = await query
            .OrderByDescending(a => a.Date)
            .Select(a => new AttendanceDto(
                a.Id,
                a.EmployeeId,
                employeeName,
                a.Date,
                a.CheckIn,
                a.CheckOut,
                a.Status,
                a.WorkingHours,
                a.Notes))
            .ToListAsync();

        return ApiResponse<List<AttendanceDto>>.SuccessResult(list);
    }

    public async Task<ApiResponse<AttendanceDto>> UpdateAttendanceAsync(Guid id, MarkAttendanceDto dto)
    {
        var isAdmin = await IsAdminUser();
        if (!isAdmin) return ApiResponse<AttendanceDto>.FailResult("Forbidden: Only HR Managers can update attendance.");
        
        var attendance = await _context.Attendances.Include(a => a.Employee).FirstOrDefaultAsync(a => a.Id == id);
        if (attendance == null) return ApiResponse<AttendanceDto>.FailResult("Attendance record not found.");

        attendance.CheckIn = dto.CheckIn;
        attendance.CheckOut = dto.CheckOut;
        attendance.Status = dto.Status;
        attendance.Notes = dto.Notes;

        if (dto.CheckIn.HasValue && dto.CheckOut.HasValue)
        {
            var diff = dto.CheckOut.Value - dto.CheckIn.Value;
            attendance.WorkingHours = (decimal)diff.TotalHours;
        }
        else attendance.WorkingHours = 0;

        await _context.SaveChangesAsync();
        return ApiResponse<AttendanceDto>.SuccessResult(MapAttendance(attendance), "Attendance updated.");
    }

    public async Task<ApiResponse<LeaveRequestDto>> CreateLeaveRequestAsync(CreateLeaveRequestDto dto)
    {
        var tenantId = _tenantService.GetTenantId();

        var targetEmployeeId = dto.EmployeeId;
        var isAdmin = await IsAdminUser();
        if (!isAdmin)
        {
            var selfEmpId = await GetCurrentEmployeeId();
            if (selfEmpId == null) return ApiResponse<LeaveRequestDto>.FailResult("User not linked to employee.");
            targetEmployeeId = selfEmpId.Value;
        }
        else if (!targetEmployeeId.HasValue || targetEmployeeId.Value == Guid.Empty)
        {
            return ApiResponse<LeaveRequestDto>.FailResult("EmployeeId is required for HR/Admin leave creation.");
        }

        if (dto.EndDate.Date < dto.StartDate.Date)
            return ApiResponse<LeaveRequestDto>.FailResult("EndDate must be on or after StartDate.");

        // Business Rule: Exclude weekends
        int businessDays = 0;
        for (var date = dto.StartDate.Date; date <= dto.EndDate.Date; date = date.AddDays(1))
        {
            if (date.DayOfWeek != DayOfWeek.Saturday && date.DayOfWeek != DayOfWeek.Sunday)
                businessDays++;
        }

        var leave = new LeaveRequest
        {
            TenantId = tenantId,
            EmployeeId = targetEmployeeId!.Value,
            LeaveType = dto.LeaveType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            TotalDays = businessDays,
            Reason = dto.Reason,
            Status = LeaveStatus.Pending
        };

        _context.LeaveRequests.Add(leave);
        await _context.SaveChangesAsync();

        return ApiResponse<LeaveRequestDto>.SuccessResult(MapLeave(leave), "Leave request submitted.");
    }

    public async Task<ApiResponse<List<LeaveRequestDto>>> GetLeaveRequestsAsync(string? status, Guid? employeeId)
    {
        var query = _context.LeaveRequests.Include(l => l.Employee).AsQueryable();
        
        var isAdmin = await IsAdminUser();
        if (!isAdmin)
        {
            var empId = await GetCurrentEmployeeId();
            if (empId == null) return ApiResponse<List<LeaveRequestDto>>.SuccessResult(new List<LeaveRequestDto>());
            query = query.Where(l => l.EmployeeId == empId.Value);
        }
        else if (employeeId.HasValue) 
            query = query.Where(l => l.EmployeeId == employeeId.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<LeaveStatus>(status, true, out var s))
            query = query.Where(l => l.Status == s);

        var list = await query.OrderByDescending(l => l.CreatedAt).ToListAsync();
        return ApiResponse<List<LeaveRequestDto>>.SuccessResult(list.Select(MapLeave).ToList());
    }

    public async Task<ApiResponse<LeaveRequestDto>> GetLeaveRequestByIdAsync(Guid id)
    {
        var leave = await _context.LeaveRequests.Include(l => l.Employee).FirstOrDefaultAsync(l => l.Id == id);
        if (leave == null) return ApiResponse<LeaveRequestDto>.FailResult("Leave request not found.");
        
        var isAdmin = await IsAdminUser();
        if (!isAdmin)
        {
            var empId = await GetCurrentEmployeeId();
            if (leave.EmployeeId != empId) return ApiResponse<LeaveRequestDto>.FailResult("Forbidden.");
        }

        return ApiResponse<LeaveRequestDto>.SuccessResult(MapLeave(leave));
    }

    public async Task<ApiResponse<bool>> ApproveLeaveRequestAsync(Guid id)
    {
        if (!await IsAdminUser()) return ApiResponse<bool>.FailResult("Forbidden.");
        
        var leave = await _context.LeaveRequests.FirstOrDefaultAsync(l => l.Id == id);
        if (leave == null) return ApiResponse<bool>.FailResult("Leave request not found.");
        leave.Status = LeaveStatus.Approved;
        leave.ApprovedAt = DateTime.UtcNow;
        leave.ApprovedBy = _currentUserService.UserId;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Leave request approved.");
    }

    public async Task<ApiResponse<bool>> RejectLeaveRequestAsync(Guid id)
    {
        if (!await IsAdminUser()) return ApiResponse<bool>.FailResult("Forbidden.");

        var leave = await _context.LeaveRequests.FirstOrDefaultAsync(l => l.Id == id);
        if (leave == null) return ApiResponse<bool>.FailResult("Leave request not found.");
        leave.Status = LeaveStatus.Rejected;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Leave request rejected.");
    }

    public async Task<ApiResponse<List<LeaveRequestDto>>> GetMyLeaveRequestsAsync(string? status)
    {
        var (empId, employeeName) = await GetCurrentEmployeeContext();
        if (empId == null)
            return ApiResponse<List<LeaveRequestDto>>.SuccessResult(new List<LeaveRequestDto>());

        var query = _context.LeaveRequests
            .Where(l => l.EmployeeId == empId.Value);

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<LeaveStatus>(status, true, out var leaveStatus))
            query = query.Where(l => l.Status == leaveStatus);

        var list = await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LeaveRequestDto(
                l.Id,
                l.EmployeeId,
                employeeName,
                l.LeaveType,
                l.StartDate,
                l.EndDate,
                l.TotalDays,
                l.Reason,
                l.Status,
                l.ApprovedBy,
                null,
                l.ApprovedAt))
            .ToListAsync();

        return ApiResponse<List<LeaveRequestDto>>.SuccessResult(list);
    }

    public async Task<ApiResponse<bool>> CancelMyLeaveRequestAsync(Guid id)
    {
        var empId = await GetCurrentEmployeeId();
        if (empId == null) return ApiResponse<bool>.FailResult("User not linked to employee.");

        var leave = await _context.LeaveRequests.FirstOrDefaultAsync(l => l.Id == id && l.EmployeeId == empId.Value);
        if (leave == null) return ApiResponse<bool>.FailResult("Leave request not found.");
        if (leave.Status != LeaveStatus.Pending) return ApiResponse<bool>.FailResult("Only pending requests can be cancelled.");

        leave.Status = LeaveStatus.Cancelled;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Leave request cancelled.");
    }

    public async Task<ApiResponse<bool>> GeneratePayrollAsync(int month, int year)
    {
        if (!await IsAdminUser()) return ApiResponse<bool>.FailResult("Forbidden.");
        
        var tenantId = _tenantService.GetTenantId();
        var employees = await _context.Employees
            .Where(e => e.Status == EmployeeStatus.Active && !e.IsDeleted)
            .ToListAsync();

        int generatedCount = 0;
        foreach (var emp in employees)
        {
            var exists = await _context.Payrolls
                .AnyAsync(p => p.EmployeeId == emp.Id && p.Month == month && p.Year == year);

            if (exists) continue;

            var allowances = emp.HouseRentAllowance + emp.TransportAllowance + emp.MedicalAllowance + emp.DearnesAllowance;
            var grossSalary = emp.BasicSalary + allowances;
            var pfDeduction = emp.BasicSalary * (emp.PFDeductionPercent / 100m);
            var ssfDeduction = grossSalary * (emp.SSFDeductionPercent / 100m);
            var tds = emp.IsTDSApplicable ? CalculateTds(grossSalary) : 0m;
            var deductions = pfDeduction + ssfDeduction + tds;

            var payroll = new Payroll
            {
                TenantId = tenantId,
                EmployeeId = emp.Id,
                Month = month,
                Year = year,
                BasicSalary = emp.BasicSalary,
                Allowances = allowances,
                Deductions = deductions,
                NetSalary = grossSalary - deductions,
                PaymentStatus = PayrollStatus.Pending
            };

            _context.Payrolls.Add(payroll);
            generatedCount++;
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, $"Payroll generated for {generatedCount} employees.");
    }

    public async Task<ApiResponse<List<PayrollDto>>> GetPayrollAsync(int month, int year)
    {
        var query = _context.Payrolls.Include(p => p.Employee).Where(p => p.Month == month && p.Year == year);
        
        var isAdmin = await IsAdminUser();
        if (!isAdmin)
        {
            var empId = await GetCurrentEmployeeId();
            if (empId == null) return ApiResponse<List<PayrollDto>>.SuccessResult(new List<PayrollDto>());
            query = query.Where(p => p.EmployeeId == empId.Value);
        }

        var list = await query.ToListAsync();
        return ApiResponse<List<PayrollDto>>.SuccessResult(list.Select(MapPayroll).ToList());
    }

    public async Task<ApiResponse<PayrollDto>> GetPayrollByIdAsync(Guid id)
    {
        var p = await _context.Payrolls.Include(p => p.Employee).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return ApiResponse<PayrollDto>.FailResult("Payroll record not found.");
        return ApiResponse<PayrollDto>.SuccessResult(MapPayroll(p));
    }

    public async Task<ApiResponse<PayrollDto>> UpdatePayrollAsync(Guid id, UpdatePayrollDto dto)
    {
        var p = await _context.Payrolls.Include(p => p.Employee).FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return ApiResponse<PayrollDto>.FailResult("Payroll record not found.");

        p.Allowances = dto.Allowances;
        p.Deductions = dto.Deductions;
        p.Notes = dto.Notes;
        p.NetSalary = p.BasicSalary + dto.Allowances - dto.Deductions;

        await _context.SaveChangesAsync();
        return ApiResponse<PayrollDto>.SuccessResult(MapPayroll(p), "Payroll updated.");
    }

    public async Task<ApiResponse<bool>> MarkPayrollAsPaidAsync(Guid id)
    {
        var p = await _context.Payrolls.FirstOrDefaultAsync(x => x.Id == id);
        if (p == null) return ApiResponse<bool>.FailResult("Payroll record not found.");
        p.PaymentStatus = PayrollStatus.Paid;
        p.PaymentDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Marked as paid.");
    }

    public async Task<ApiResponse<PayrollSummaryDto>> GetPayrollSummaryAsync(int month, int year)
    {
        var payrolls = await _context.Payrolls
            .Where(p => p.Month == month && p.Year == year)
            .ToListAsync();

        var summary = new PayrollSummaryDto(
            payrolls.Sum(p => p.NetSalary),
            payrolls.Count(p => p.PaymentStatus == PayrollStatus.Paid),
            payrolls.Count(p => p.PaymentStatus == PayrollStatus.Pending)
        );

        return ApiResponse<PayrollSummaryDto>.SuccessResult(summary);
    }

    public async Task<ApiResponse<List<PayrollDto>>> GetMyPayslipsAsync()
    {
        var (empId, employeeName) = await GetCurrentEmployeeContext();
        if (empId == null)
            return ApiResponse<List<PayrollDto>>.SuccessResult(new List<PayrollDto>());

        var list = await _context.Payrolls
            .Where(p => p.EmployeeId == empId.Value)
            .OrderByDescending(p => p.Year)
            .ThenByDescending(p => p.Month)
            .Select(p => new PayrollDto(
                p.Id,
                p.EmployeeId,
                employeeName,
                p.Month,
                p.Year,
                p.BasicSalary,
                p.Allowances,
                p.Deductions,
                p.NetSalary,
                p.PaymentStatus,
                p.PaymentDate,
                p.Notes))
            .ToListAsync();

        return ApiResponse<List<PayrollDto>>.SuccessResult(list);
    }

    private async Task<string> GenerateEmployeeCodeAsync(Guid tenantId)
    {
        var count = await _context.Employees.IgnoreQueryFilters().CountAsync(e => e.TenantId == tenantId) + 1;
        return $"EMP-{count:D3}";
    }

    private static decimal CalculateTds(decimal grossSalary)
    {
        if (grossSalary <= 50000) return 0m;
        return grossSalary * 0.01m;
    }

    private async Task<bool> IsAdminUser()
    {
        var userId = _currentUserService.UserId;
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) return false;
        
        var adminRoles = new[] { UserRole.Owner, UserRole.Admin, UserRole.HRManager, UserRole.SuperAdmin };
        return adminRoles.Contains(user.Role);
    }

    private async Task<Guid?> GetCurrentEmployeeId()
    {
        var (employeeId, _) = await GetCurrentEmployeeContext();
        return employeeId;
    }

    private async Task<(Guid? EmployeeId, string EmployeeName)> GetCurrentEmployeeContext()
    {
        var email = _currentUserService.Email;
        var userId = _currentUserService.UserId;
        var tenantId = _tenantService.GetTenantId();

        var employee = await _context.Employees
            .Where(e =>
                (e.Email != null && !string.IsNullOrWhiteSpace(email) && e.Email.ToLower() == email.ToLower()))
            .Select(e => new { e.Id, e.FirstName, e.LastName })
            .FirstOrDefaultAsync();

        if (employee != null)
            return (employee.Id, $"{employee.FirstName} {employee.LastName}".Trim());

        // Backward-compatible self-service behavior: if legacy data has users without employee links,
        // create a minimal employee profile on first self-service request.
        if (userId == Guid.Empty)
            return (null, string.Empty);

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null)
            return (null, string.Empty);

        var resolvedTenantId = tenantId != Guid.Empty ? tenantId : (user.CurrentTenantId ?? Guid.Empty);
        if (resolvedTenantId == Guid.Empty)
            return (null, string.Empty);

        var newEmployee = new Employee
        {
            TenantId = resolvedTenantId,
            FirstName = string.IsNullOrWhiteSpace(user.FirstName) ? "Team" : user.FirstName,
            LastName = string.IsNullOrWhiteSpace(user.LastName) ? "Member" : user.LastName,
            Email = user.Email,
            Phone = user.PhoneNumber,
            Position = "Staff",
            Department = "General",
            EmployeeCode = await GenerateEmployeeCodeAsync(resolvedTenantId),
            JoinDate = DateTime.UtcNow,
            EmploymentType = EmploymentType.FullTime,
            Status = EmployeeStatus.Active,
            BasicSalary = 0m,
        };

        _context.Employees.Add(newEmployee);
        await _context.SaveChangesAsync();

        return (newEmployee.Id, $"{newEmployee.FirstName} {newEmployee.LastName}".Trim());
    }

    public async Task<ApiResponse<HRAssistanceRequestDto>> CreateAssistanceRequestAsync(CreateHRAssistanceRequestDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var (employeeId, employeeName) = await GetCurrentEmployeeContext();
        
        if (employeeId == null) return ApiResponse<HRAssistanceRequestDto>.FailResult("Logged in user is not linked to an employee record.");

        var request = new HRAssistanceRequest
        {
            TenantId = tenantId,
            EmployeeId = employeeId.Value,
            Category = dto.Category,
            Subject = dto.Subject,
            Message = dto.Message,
            Status = "Pending"
        };

        _context.HRAssistanceRequests.Add(request);
        await _context.SaveChangesAsync();

        return ApiResponse<HRAssistanceRequestDto>.SuccessResult(
            new HRAssistanceRequestDto(
                request.Id,
                request.EmployeeId,
                employeeName,
                request.Category,
                request.Subject,
                request.Message,
                request.Status,
                request.Response,
                request.CreatedAt,
                request.HandledAt,
                null),
            "Request submitted to HR.");
    }

    public async Task<ApiResponse<List<HRAssistanceRequestDto>>> GetAssistanceRequestsAsync(string? status, Guid? employeeId)
    {
        var query = _context.HRAssistanceRequests.Include(a => a.Employee).AsQueryable();
        
        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);
            
        if (employeeId.HasValue)
            query = query.Where(a => a.EmployeeId == employeeId.Value);

        var list = await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
        return ApiResponse<List<HRAssistanceRequestDto>>.SuccessResult(list.Select(MapAssistanceRequest).ToList());
    }

    public async Task<ApiResponse<List<HRAssistanceRequestDto>>> GetMyAssistanceRequestsAsync(string? status)
    {
        var (empId, employeeName) = await GetCurrentEmployeeContext();
        if (empId == null)
            return ApiResponse<List<HRAssistanceRequestDto>>.SuccessResult(new List<HRAssistanceRequestDto>());

        var query = _context.HRAssistanceRequests
            .Where(a => a.EmployeeId == empId.Value);

        if (!string.IsNullOrEmpty(status))
            query = query.Where(a => a.Status == status);

        var list = await query
            .OrderByDescending(a => a.CreatedAt)
            .Select(a => new HRAssistanceRequestDto(
                a.Id,
                a.EmployeeId,
                employeeName,
                a.Category,
                a.Subject,
                a.Message,
                a.Status,
                a.Response,
                a.CreatedAt,
                a.HandledAt,
                null))
            .ToListAsync();

        return ApiResponse<List<HRAssistanceRequestDto>>.SuccessResult(list);
    }

    public async Task<ApiResponse<bool>> ResolveAssistanceRequestAsync(Guid id, ResolveHRAssistanceRequestDto dto)
    {
        var request = await _context.HRAssistanceRequests.FirstOrDefaultAsync(a => a.Id == id);
        if (request == null) return ApiResponse<bool>.FailResult("Request not found.");

        request.Status = dto.Status;
        request.Response = dto.Response;
        request.HandledBy = _currentUserService.UserId;
        request.HandledAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Request resolved.");
    }

    private static EmployeeDto MapEmployee(Employee e) => new(
        e.Id, e.FirstName, e.LastName, e.Email, e.Phone, e.Position, e.Department, 
        e.EmployeeCode, e.JoinDate, e.EmploymentType, e.Status, e.BasicSalary,
        e.CitizenshipNumber, e.BankAccountNumber, e.BankName, e.PANNumber,
        e.HouseRentAllowance, e.TransportAllowance, e.MedicalAllowance, e.DearnesAllowance,
        e.PFDeductionPercent, e.SSFDeductionPercent, e.IsTDSApplicable,
        e.Address, 
        e.EmergencyContactName, e.EmergencyContactPhone, e.UserId);

    private static HRAssistanceRequestDto MapAssistanceRequest(HRAssistanceRequest a) => new(
        a.Id, a.EmployeeId, $"{a.Employee?.FirstName} {a.Employee?.LastName}".Trim(),
        a.Category, a.Subject, a.Message, a.Status, a.Response, a.CreatedAt, a.HandledAt, null);

    private static AttendanceDto MapAttendance(Attendance a) => new(
        a.Id, a.EmployeeId, $"{a.Employee?.FirstName} {a.Employee?.LastName}".Trim(),
        a.Date, a.CheckIn, a.CheckOut, a.Status, a.WorkingHours, a.Notes);

    private static LeaveRequestDto MapLeave(LeaveRequest l) => new(
        l.Id, l.EmployeeId, $"{l.Employee?.FirstName} {l.Employee?.LastName}".Trim(),
        l.LeaveType, l.StartDate, l.EndDate, l.TotalDays, l.Reason, l.Status, 
        l.ApprovedBy, null, l.ApprovedAt);

    private static PayrollDto MapPayroll(Payroll p) => new(
        p.Id, p.EmployeeId, $"{p.Employee?.FirstName} {p.Employee?.LastName}".Trim(),
        p.Month, p.Year, p.BasicSalary, p.Allowances, p.Deductions, p.NetSalary,
        p.PaymentStatus, p.PaymentDate, p.Notes);
}
