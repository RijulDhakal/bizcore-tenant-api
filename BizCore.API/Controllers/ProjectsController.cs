using BizCore.API.Middleware;
using BizCore.Application.DTOs.ProjectManagement;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[Authorize]
[RequireModule("projects")]
[ApiController]
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService) => _projectService = projectService;

    [HttpGet]
    public async Task<IActionResult> GetProjects(string? status, string? search)
        => Ok(await _projectService.GetProjectsAsync(status, search));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(Guid id) => Ok(await _projectService.GetProjectByIdAsync(id));

    [HttpPost]
    public async Task<IActionResult> CreateProject(CreateProjectDto dto) => Ok(await _projectService.CreateProjectAsync(dto));

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(Guid id, CreateProjectDto dto) => Ok(await _projectService.UpdateProjectAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(Guid id) => Ok(await _projectService.DeleteProjectAsync(id));

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary() => Ok(await _projectService.GetProjectSummaryAsync());

    // Tasks
    [HttpGet("{projectId}/tasks")]
    public async Task<IActionResult> GetTasks(Guid projectId, string? status)
        => Ok(await _projectService.GetTasksAsync(projectId, status));

    [HttpPost("{projectId}/tasks")]
    public async Task<IActionResult> CreateTask(Guid projectId, CreateProjectTaskDto dto)
        => Ok(await _projectService.CreateTaskAsync(projectId, dto));

    [HttpGet("tasks/{id}")]
    public async Task<IActionResult> GetTask(Guid id) => Ok(await _projectService.GetTaskByIdAsync(id));

    [HttpPut("tasks/{id}")]
    public async Task<IActionResult> UpdateTask(Guid id, CreateProjectTaskDto dto)
        => Ok(await _projectService.UpdateTaskAsync(id, dto));

    [HttpPost("tasks/{id}/move")]
    public async Task<IActionResult> MoveTask(Guid id, MoveTaskDto dto) => Ok(await _projectService.MoveTaskAsync(id, dto));

    [HttpDelete("tasks/{id}")]
    public async Task<IActionResult> DeleteTask(Guid id) => Ok(await _projectService.DeleteTaskAsync(id));

    // Timesheets
    [HttpGet("timesheets")]
    public async Task<IActionResult> GetTimesheets(Guid? employeeId, Guid? projectId, DateTime? fromDate, DateTime? toDate)
        => Ok(await _projectService.GetTimesheetsAsync(employeeId, projectId, fromDate, toDate));

    [HttpPost("timesheets")]
    public async Task<IActionResult> LogTime(CreateTimesheetDto dto) => Ok(await _projectService.LogTimeAsync(dto));
}
