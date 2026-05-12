using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using FluentAssertions;
using Xunit;

namespace BizCore.UnitTests.Domain.Entities;

public class EmployeeTests
{
    [Theory]
    [InlineData(EmploymentType.FullTime)]
    [InlineData(EmploymentType.PartTime)]
    [InlineData(EmploymentType.Contract)]
    public void Employee_EmploymentTypes_AreValid(EmploymentType type)
    {
        var employee = new Employee();
        employee.EmploymentType = type;
        employee.EmploymentType.Should().Be(type);
    }

    [Theory]
    [InlineData(EmployeeStatus.Active)]
    [InlineData(EmployeeStatus.OnLeave)]
    [InlineData(EmployeeStatus.Terminated)]
    public void Employee_Statuses_AreValid(EmployeeStatus status)
    {
        var employee = new Employee();
        employee.Status = status;
        employee.Status.Should().Be(status);
    }

    [Fact]
    public void Employee_HasSalaryComponents()
    {
        var employee = new Employee
        {
            BasicSalary = 50000m,
            HouseRentAllowance = 5000m,
            TransportAllowance = 2000m,
            MedicalAllowance = 1000m
        };
        var total = employee.BasicSalary + employee.HouseRentAllowance + employee.TransportAllowance + employee.MedicalAllowance;
        total.Should().Be(58000m);
    }

    [Fact]
    public void Employee_HasDeductionPercentages()
    {
        var employee = new Employee
        {
            BasicSalary = 50000m,
            PFDeductionPercent = 10,
            SSFDeductionPercent = 1
        };
        var pfDeduction = employee.BasicSalary * employee.PFDeductionPercent / 100;
        var ssfDeduction = employee.BasicSalary * employee.SSFDeductionPercent / 100;
        pfDeduction.Should().Be(5000m);
        ssfDeduction.Should().Be(500m);
    }

    [Fact]
    public void Employee_DefaultBasicSalary_IsZero()
    {
        var employee = new Employee();
        employee.BasicSalary.Should().Be(0m);
    }
}
