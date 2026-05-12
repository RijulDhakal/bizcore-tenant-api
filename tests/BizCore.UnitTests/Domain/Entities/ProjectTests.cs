using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace BizCore.UnitTests.Domain.Entities;

public class ProjectTests
{
    [Fact]
    public void Project_NewProject_HasPlanningStatus()
    {
        var project = new Project();
        project.Status.Should().Be(ProjectStatus.Planning);
    }

    [Fact]
    public void Project_AddTask_UpdatesTaskCount()
    {
        var project = new Project { Name = "Test Project", Status = ProjectStatus.Active };
        var task = new ProjectTask { Title = "Task 1", Status = ProjectTaskStatus.Todo };
        project.Tasks.Add(task);
        project.Tasks.Should().HaveCount(1);
    }

    [Theory]
    [InlineData(ProjectStatus.Planning)]
    [InlineData(ProjectStatus.Active)]
    [InlineData(ProjectStatus.OnHold)]
    [InlineData(ProjectStatus.Completed)]
    [InlineData(ProjectStatus.Cancelled)]
    public void Project_StatusTransitions_AreValid(ProjectStatus status)
    {
        var project = new Project();
        project.Status = status;
        project.Status.Should().Be(status);
    }

    [Fact]
    public void Project_CanSetBudget()
    {
        var project = new Project { Budget = 100000m };
        project.Budget.Should().Be(100000m);
    }

    [Fact]
    public void ProjectTask_StatusTransitions()
    {
        var task = new ProjectTask { Status = ProjectTaskStatus.Todo };
        task.Status = ProjectTaskStatus.InProgress;
        task.Status.Should().Be(ProjectTaskStatus.InProgress);
        task.Status = ProjectTaskStatus.InReview;
        task.Status.Should().Be(ProjectTaskStatus.InReview);
        task.Status = ProjectTaskStatus.Done;
        task.Status.Should().Be(ProjectTaskStatus.Done);
    }
}
