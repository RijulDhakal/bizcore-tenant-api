using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BizCore.Infrastructure.Data;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    private Guid TenantId => Guid.TryParse(User.FindFirst("tid")?.Value, out var tid) ? tid : Guid.Empty;
    private string Role => User.FindFirst("role")?.Value ?? string.Empty;

    [HttpGet]
    public async Task<ActionResult<ApiResponse<object>>> GetDashboard()
    {
        if (TenantId == Guid.Empty)
            return BadRequest(ApiResponse<object>.FailResult("Tenant missing."));

        if (Role is "Owner" or "Admin")
            return Ok(ApiResponse<object>.SuccessResult(await BuildOwnerDashboardAsync()));

        if (Role == "HRManager")
            return Ok(ApiResponse<object>.SuccessResult(await BuildHrDashboardAsync()));

        if (Role == "Sales")
            return Ok(ApiResponse<object>.SuccessResult(await BuildSalesDashboardAsync()));

        if (Role == "Accountant")
            return Ok(ApiResponse<object>.SuccessResult(await BuildFinanceDashboardAsync()));

        if (Role == "POSOperator")
            return Ok(ApiResponse<object>.SuccessResult(await BuildPosDashboardAsync()));

        return Ok(ApiResponse<object>.SuccessResult(new { }));
    }

    [HttpGet("owner")]
    [Authorize(Roles = "Owner,Admin")]
    public async Task<ActionResult<ApiResponse<object>>> GetOwnerDashboard()
    {
        if (TenantId == Guid.Empty)
            return BadRequest(ApiResponse<object>.FailResult("Tenant missing."));

        return Ok(ApiResponse<object>.SuccessResult(await BuildOwnerDashboardAsync()));
    }

    private async Task<object> BuildOwnerDashboardAsync()
    {
        var revenue = await _context.Invoices.SumAsync(i => i.TotalAmount);
        var expenses = await _context.Expenses.SumAsync(e => e.Amount);
        var customers = await _context.Contacts.CountAsync(c => c.Type == ContactType.Customer);
        var employeeCount = await _context.Employees.CountAsync();
        var pendingLeaves = await _context.LeaveRequests.CountAsync(l => l.Status == LeaveStatus.Pending);

        var recentInvoices = await _context.Invoices
            .Include(i => i.Customer)
            .OrderByDescending(i => i.IssueDate)
            .Take(5)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                customerName = i.Customer != null ? i.Customer.Name : "Customer",
                totalAmount = i.TotalAmount,
                issueDate = i.IssueDate
            })
            .ToListAsync();

        return new
        {
            revenue,
            expenses,
            customers,
            employeeCount,
            pendingLeaves,
            profitLoss = revenue - expenses,
            recentInvoices
        };
    }

    [HttpGet("finance")]
    [Authorize(Roles = "Owner,Admin,Accountant")]
    public async Task<ActionResult<ApiResponse<object>>> GetFinanceDashboard()
    {
        if (TenantId == Guid.Empty)
            return BadRequest(ApiResponse<object>.FailResult("Tenant missing."));

        return Ok(ApiResponse<object>.SuccessResult(await BuildFinanceDashboardAsync()));
    }

    private async Task<object> BuildFinanceDashboardAsync()
    {
        var revenue = await _context.Invoices.SumAsync(i => i.TotalAmount);
        var expenses = await _context.Expenses.SumAsync(e => e.Amount);
        var outstanding = await _context.Invoices
            .Where(i => i.Status != InvoiceStatus.Paid)
            .SumAsync(i => i.TotalAmount);
        var reportCount = await _context.Invoices.CountAsync();

        var recentInvoices = await _context.Invoices
            .Include(i => i.Customer)
            .OrderByDescending(i => i.IssueDate)
            .Take(5)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                customerName = i.Customer != null ? i.Customer.Name : "Customer",
                totalAmount = i.TotalAmount,
                issueDate = i.IssueDate
            })
            .ToListAsync();

        return new
        {
            expenses,
            profitLoss = revenue - expenses,
            reports = reportCount,
            outstanding,
            recentInvoices
        };
    }

    [HttpGet("hr")]
    [Authorize(Roles = "Owner,Admin,HRManager")]
    public async Task<ActionResult<ApiResponse<object>>> GetHrDashboard()
    {
        if (TenantId == Guid.Empty)
            return BadRequest(ApiResponse<object>.FailResult("Tenant missing."));

        return Ok(ApiResponse<object>.SuccessResult(await BuildHrDashboardAsync()));
    }

    private async Task<object> BuildHrDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var employeeCount = await _context.Employees.CountAsync();
        var pendingLeaves = await _context.LeaveRequests.CountAsync(l => l.Status == LeaveStatus.Pending);
        var attendancePresent = await _context.Attendances.CountAsync(a => a.Date.Date == today && a.Status == AttendanceStatus.Present);
        var assistanceOpen = await _context.HRAssistanceRequests.CountAsync(a => a.Status == "Pending" || a.Status == "InProgress");

        return new
        {
            leaveRequests = pendingLeaves,
            attendance = attendancePresent,
            employeeCount,
            assistanceOpen
        };
    }

    [HttpGet("sales")]
    [Authorize(Roles = "Owner,Admin,Sales")]
    public async Task<ActionResult<ApiResponse<object>>> GetSalesDashboard()
    {
        if (TenantId == Guid.Empty)
            return BadRequest(ApiResponse<object>.FailResult("Tenant missing."));

        return Ok(ApiResponse<object>.SuccessResult(await BuildSalesDashboardAsync()));
    }

    private async Task<object> BuildSalesDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var salesToday = await _context.Invoices
            .Where(i => i.IssueDate.Date == today)
            .SumAsync(i => i.TotalAmount);
        var customers = await _context.Contacts.CountAsync(c => c.Type == ContactType.Customer);
        var orders = await _context.Invoices.Where(i => i.IssueDate.Date == today).CountAsync();

        var recentInvoices = await _context.Invoices
            .Include(i => i.Customer)
            .OrderByDescending(i => i.IssueDate)
            .Take(5)
            .Select(i => new
            {
                i.Id,
                i.InvoiceNumber,
                customerName = i.Customer != null ? i.Customer.Name : "Customer",
                totalAmount = i.TotalAmount,
                issueDate = i.IssueDate
            })
            .ToListAsync();

        return new
        {
            salesToday,
            customers,
            orders,
            recentInvoices
        };
    }

    [HttpGet("pos")]
    [Authorize(Roles = "Owner,Admin,POSOperator")]
    public async Task<ActionResult<ApiResponse<object>>> GetPosDashboard()
    {
        if (TenantId == Guid.Empty)
            return BadRequest(ApiResponse<object>.FailResult("Tenant missing."));

        return Ok(ApiResponse<object>.SuccessResult(await BuildPosDashboardAsync()));
    }

    private async Task<object> BuildPosDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var todayTransactions = await _context.POSTransactions.CountAsync(t => t.CompletedAt.Date == today);
        var todaySales = await _context.POSTransactions
            .Where(t => t.CompletedAt.Date == today)
            .SumAsync(t => t.TotalAmount);
        var openSessions = await _context.POSSessions.CountAsync(s => s.Status == POSSessionStatus.Open);

        return new
        {
            todayTransactions,
            todaySales,
            openSessions
        };
    }
}
