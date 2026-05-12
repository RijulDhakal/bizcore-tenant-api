using BizCore.Application.DTOs.ProjectManagement;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IProjectService
{
    // Projects
    Task<ApiResponse<ProjectDto>> CreateProjectAsync(CreateProjectDto dto);
    Task<ApiResponse<List<ProjectDto>>> GetProjectsAsync(string? status, string? search);
    Task<ApiResponse<ProjectDto>> GetProjectByIdAsync(Guid id);
    Task<ApiResponse<ProjectDto>> UpdateProjectAsync(Guid id, CreateProjectDto dto);
    Task<ApiResponse<bool>> DeleteProjectAsync(Guid id);
    Task<ApiResponse<ProjectSummaryDto>> GetProjectSummaryAsync();

    // Tasks
    Task<ApiResponse<ProjectTaskDto>> CreateTaskAsync(Guid projectId, CreateProjectTaskDto dto);
    Task<ApiResponse<List<ProjectTaskDto>>> GetTasksAsync(Guid projectId, string? status);
    Task<ApiResponse<ProjectTaskDto>> GetTaskByIdAsync(Guid id);
    Task<ApiResponse<ProjectTaskDto>> UpdateTaskAsync(Guid id, CreateProjectTaskDto dto);
    Task<ApiResponse<bool>> MoveTaskAsync(Guid id, MoveTaskDto dto);
    Task<ApiResponse<bool>> DeleteTaskAsync(Guid id);

    // Timesheets
    Task<ApiResponse<TimesheetDto>> LogTimeAsync(CreateTimesheetDto dto);
    Task<ApiResponse<List<TimesheetDto>>> GetTimesheetsAsync(Guid? employeeId, Guid? projectId, DateTime? fromDate, DateTime? toDate);
    Task<ApiResponse<List<ProjectSummaryDto>>> GetTimesheetSummaryAsyncByProject();
}
