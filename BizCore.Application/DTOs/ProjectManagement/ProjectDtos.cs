using BizCore.Domain.Enums;

namespace BizCore.Application.DTOs.ProjectManagement;

public record ProjectDto(
    Guid Id,
    string Name,
    string? Description,
    ProjectStatus Status,
    ProjectPriority Priority,
    DateTime? StartDate,
    DateTime? DueDate,
    decimal? Budget,
    Guid? ClientId,
    string? ClientName,
    Guid? ManagerId,
    string? ManagerName,
    string Color,
    int TaskCount,
    int CompletedTaskCount);

public record CreateProjectDto(
    string Name,
    string? Description,
    ProjectStatus Status,
    ProjectPriority Priority,
    DateTime? StartDate,
    DateTime? DueDate,
    decimal? Budget,
    Guid? ClientId,
    Guid? ManagerId,
    string Color);

public record ProjectTaskDto(
    Guid Id,
    Guid ProjectId,
    string ProjectName,
    string Title,
    string? Description,
    ProjectTaskStatus Status,
    ProjectPriority Priority,
    Guid? AssigneeId,
    string? AssigneeName,
    DateTime? DueDate,
    decimal? EstimatedHours,
    decimal? ActualHours,
    int Position);

public record CreateProjectTaskDto(
    string Title,
    string? Description,
    ProjectTaskStatus Status,
    ProjectPriority Priority,
    Guid? AssigneeId,
    DateTime? DueDate,
    decimal? EstimatedHours);

public record MoveTaskDto(ProjectTaskStatus Status, int Position);

public record TimesheetDto(
    Guid Id,
    Guid EmployeeId,
    string EmployeeName,
    Guid ProjectId,
    string ProjectName,
    Guid? TaskId,
    string? TaskTitle,
    DateTime Date,
    decimal HoursLogged,
    string? Description,
    bool IsBillable);

public record CreateTimesheetDto(
    Guid EmployeeId,
    Guid ProjectId,
    Guid? TaskId,
    DateTime Date,
    decimal HoursLogged,
    string? Description,
    bool IsBillable);

public record ProjectSummaryDto(
    int TotalProjects,
    int ActiveProjects,
    int CompletedProjects,
    int TasksCount);
