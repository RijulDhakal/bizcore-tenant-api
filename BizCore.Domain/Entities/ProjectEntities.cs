using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class Project : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProjectStatus Status { get; set; }
    public ProjectPriority Priority { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal? Budget { get; set; }
    public Guid? ClientId { get; set; }
    public Contact? Client { get; set; }
    public Guid? ManagerId { get; set; }
    public Employee? Manager { get; set; }
    public string Color { get; set; } = "#4F6EF7";

    public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>();
    public ICollection<Timesheet> Timesheets { get; set; } = new List<Timesheet>();
}

public class ProjectTask : TenantEntity
{
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ProjectTaskStatus Status { get; set; }
    public ProjectPriority Priority { get; set; }
    public Guid? AssigneeId { get; set; }
    public Employee? Assignee { get; set; }
    public DateTime? DueDate { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? ActualHours { get; set; }
    public int Position { get; set; }
}

public class Timesheet : TenantEntity
{
    public Guid EmployeeId { get; set; }
    public Employee? Employee { get; set; }
    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid? TaskId { get; set; }
    public ProjectTask? Task { get; set; }
    public DateTime Date { get; set; }
    public decimal HoursLogged { get; set; }
    public string? Description { get; set; }
    public bool IsBillable { get; set; } = true;
}
