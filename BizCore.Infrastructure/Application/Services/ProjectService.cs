using BizCore.Application.DTOs.ProjectManagement;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public ProjectService(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<ApiResponse<ProjectDto>> CreateProjectAsync(CreateProjectDto dto)
    {
        var project = new Project
        {
            TenantId = _tenantService.GetTenantId(),
            Name = dto.Name,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            StartDate = dto.StartDate,
            DueDate = dto.DueDate,
            Budget = dto.Budget,
            ClientId = dto.ClientId,
            ManagerId = dto.ManagerId,
            Color = dto.Color
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        return ApiResponse<ProjectDto>.SuccessResult(MapProject(project), "Project created.");
    }

    public async Task<ApiResponse<List<ProjectDto>>> GetProjectsAsync(string? status, string? search)
    {
        var query = _context.Projects.Include(p => p.Client).Include(p => p.Manager).Include(p => p.Tasks).AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Name.ToLower().Contains(search.ToLower()));

        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ProjectStatus>(status, true, out var s))
            query = query.Where(p => p.Status == s);

        var list = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return ApiResponse<List<ProjectDto>>.SuccessResult(list.Select(MapProject).ToList());
    }

    public async Task<ApiResponse<ProjectDto>> GetProjectByIdAsync(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.Client)
            .Include(p => p.Manager)
            .Include(p => p.Tasks)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (project == null) return ApiResponse<ProjectDto>.FailResult("Project not found.");
        return ApiResponse<ProjectDto>.SuccessResult(MapProject(project));
    }

    public async Task<ApiResponse<ProjectDto>> UpdateProjectAsync(Guid id, CreateProjectDto dto)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return ApiResponse<ProjectDto>.FailResult("Project not found.");

        project.Name = dto.Name;
        project.Description = dto.Description;
        project.Status = dto.Status;
        project.Priority = dto.Priority;
        project.StartDate = dto.StartDate;
        project.DueDate = dto.DueDate;
        project.Budget = dto.Budget;
        project.ClientId = dto.ClientId;
        project.ManagerId = dto.ManagerId;
        project.Color = dto.Color;

        await _context.SaveChangesAsync();
        return ApiResponse<ProjectDto>.SuccessResult(MapProject(project), "Project updated.");
    }

    public async Task<ApiResponse<bool>> DeleteProjectAsync(Guid id)
    {
        var project = await _context.Projects.FirstOrDefaultAsync(p => p.Id == id);
        if (project == null) return ApiResponse<bool>.FailResult("Project not found.");
        project.IsDeleted = true;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Project deleted.");
    }

    public async Task<ApiResponse<ProjectSummaryDto>> GetProjectSummaryAsync()
    {
        var projects = await _context.Projects.Include(p => p.Tasks).ToListAsync();
        var summary = new ProjectSummaryDto(
            projects.Count,
            projects.Count(p => p.Status == ProjectStatus.Active),
            projects.Count(p => p.Status == ProjectStatus.Completed),
            projects.Sum(p => p.Tasks.Count)
        );
        return ApiResponse<ProjectSummaryDto>.SuccessResult(summary);
    }

    public async Task<ApiResponse<ProjectTaskDto>> CreateTaskAsync(Guid projectId, CreateProjectTaskDto dto)
    {
        var position = await _context.ProjectTasks.CountAsync(t => t.ProjectId == projectId && t.Status == dto.Status);

        var task = new ProjectTask
        {
            TenantId = _tenantService.GetTenantId(),
            ProjectId = projectId,
            Title = dto.Title,
            Description = dto.Description,
            Status = dto.Status,
            Priority = dto.Priority,
            AssigneeId = dto.AssigneeId,
            DueDate = dto.DueDate,
            EstimatedHours = dto.EstimatedHours,
            Position = position
        };

        _context.ProjectTasks.Add(task);
        await _context.SaveChangesAsync();

        return ApiResponse<ProjectTaskDto>.SuccessResult(MapTask(task), "Task created.");
    }

    public async Task<ApiResponse<List<ProjectTaskDto>>> GetTasksAsync(Guid projectId, string? status)
    {
        var query = _context.ProjectTasks.Include(t => t.Assignee).Where(t => t.ProjectId == projectId);
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ProjectTaskStatus>(status, true, out var s))
            query = query.Where(t => t.Status == s);

        var list = await query.OrderBy(t => t.Position).ToListAsync();
        return ApiResponse<List<ProjectTaskDto>>.SuccessResult(list.Select(MapTask).ToList());
    }

    public async Task<ApiResponse<ProjectTaskDto>> GetTaskByIdAsync(Guid id)
    {
        var task = await _context.ProjectTasks.Include(t => t.Assignee).Include(t => t.Project).FirstOrDefaultAsync(t => t.Id == id);
        if (task == null) return ApiResponse<ProjectTaskDto>.FailResult("Task not found.");
        return ApiResponse<ProjectTaskDto>.SuccessResult(MapTask(task));
    }

    public async Task<ApiResponse<ProjectTaskDto>> UpdateTaskAsync(Guid id, CreateProjectTaskDto dto)
    {
        var task = await _context.ProjectTasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task == null) return ApiResponse<ProjectTaskDto>.FailResult("Task not found.");

        task.Title = dto.Title;
        task.Description = dto.Description;
        task.Status = dto.Status;
        task.Priority = dto.Priority;
        task.AssigneeId = dto.AssigneeId;
        task.DueDate = dto.DueDate;
        task.EstimatedHours = dto.EstimatedHours;

        await _context.SaveChangesAsync();
        return ApiResponse<ProjectTaskDto>.SuccessResult(MapTask(task), "Task updated.");
    }

    public async Task<ApiResponse<bool>> MoveTaskAsync(Guid id, MoveTaskDto dto)
    {
        var task = await _context.ProjectTasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task == null) return ApiResponse<bool>.FailResult("Task not found.");

        task.Status = dto.Status;
        task.Position = dto.Position;

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Task moved.");
    }

    public async Task<ApiResponse<bool>> DeleteTaskAsync(Guid id)
    {
        var task = await _context.ProjectTasks.FirstOrDefaultAsync(t => t.Id == id);
        if (task == null) return ApiResponse<bool>.FailResult("Task not found.");
        task.IsDeleted = true;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Task deleted.");
    }

    public async Task<ApiResponse<TimesheetDto>> LogTimeAsync(CreateTimesheetDto dto)
    {
        var timesheet = new Timesheet
        {
            TenantId = _tenantService.GetTenantId(),
            EmployeeId = dto.EmployeeId,
            ProjectId = dto.ProjectId,
            TaskId = dto.TaskId,
            Date = dto.Date,
            HoursLogged = dto.HoursLogged,
            Description = dto.Description,
            IsBillable = dto.IsBillable
        };

        _context.Timesheets.Add(timesheet);

        if (dto.TaskId.HasValue)
        {
            var task = await _context.ProjectTasks.FindAsync(dto.TaskId.Value);
            if (task != null)
            {
                task.ActualHours = (task.ActualHours ?? 0) + dto.HoursLogged;
            }
        }

        await _context.SaveChangesAsync();
        return ApiResponse<TimesheetDto>.SuccessResult(MapTimesheet(timesheet), "Time logged.");
    }

    public async Task<ApiResponse<List<TimesheetDto>>> GetTimesheetsAsync(Guid? employeeId, Guid? projectId, DateTime? fromDate, DateTime? toDate)
    {
        var query = _context.Timesheets.Include(t => t.Employee).Include(t => t.Project).Include(t => t.Task).AsQueryable();

        if (employeeId.HasValue) query = query.Where(t => t.EmployeeId == employeeId.Value);
        if (projectId.HasValue) query = query.Where(t => t.ProjectId == projectId.Value);
        if (fromDate.HasValue) query = query.Where(t => t.Date >= fromDate.Value);
        if (toDate.HasValue) query = query.Where(t => t.Date <= toDate.Value);

        var list = await query.OrderByDescending(t => t.Date).ToListAsync();
        return ApiResponse<List<TimesheetDto>>.SuccessResult(list.Select(MapTimesheet).ToList());
    }

    public async Task<ApiResponse<List<ProjectSummaryDto>>> GetTimesheetSummaryAsyncByProject()
    {
        return ApiResponse<List<ProjectSummaryDto>>.SuccessResult(new List<ProjectSummaryDto>());
    }

    private static ProjectDto MapProject(Project p) => new(
        p.Id, p.Name, p.Description, p.Status, p.Priority, p.StartDate, p.DueDate, p.Budget, 
        p.ClientId, p.Client?.Name, p.ManagerId, $"{p.Manager?.FirstName} {p.Manager?.LastName}".Trim(), 
        p.Color, p.Tasks.Count, p.Tasks.Count(t => t.Status == ProjectTaskStatus.Done));

    private static ProjectTaskDto MapTask(ProjectTask t) => new(
        t.Id, t.ProjectId, t.Project?.Name ?? "", t.Title, t.Description, t.Status, t.Priority, 
        t.AssigneeId, $"{t.Assignee?.FirstName} {t.Assignee?.LastName}".Trim(), 
        t.DueDate, t.EstimatedHours, t.ActualHours, t.Position);

    private static TimesheetDto MapTimesheet(Timesheet t) => new(
        t.Id, t.EmployeeId, $"{t.Employee?.FirstName} {t.Employee?.LastName}".Trim(),
        t.ProjectId, t.Project?.Name ?? "", t.TaskId, t.Task?.Title, t.Date, t.HoursLogged, 
        t.Description, t.IsBillable);
}
