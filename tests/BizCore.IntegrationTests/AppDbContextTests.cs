using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Application.Interfaces;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BizCore.IntegrationTests;

public class MockTenantService : ITenantService
{
    private Guid _tenantId = Guid.NewGuid();

    public Guid GetTenantId() => _tenantId;
    public void SetTenantId(Guid tenantId) => _tenantId = tenantId;
}

public class AppDbContextTests : IDisposable
{
    private readonly AppDbContext _context;
    private readonly MockTenantService _tenantService;

    public AppDbContextTests()
    {
        _tenantService = new MockTenantService();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options, _tenantService);
    }

    [Fact]
    public async Task Invoice_CreatesWithCorrectSchema()
    {
        var invoice = new Invoice
        {
            Id = Guid.NewGuid(),
            InvoiceNumber = "INV-TEST-001",
            CustomerId = Guid.NewGuid(),
            SubTotal = 1000m,
            TaxAmount = 130m,
            TotalAmount = 1130m,
            Status = InvoiceStatus.Draft,
            TenantId = _tenantService.GetTenantId()
        };

        await _context.Invoices.AddAsync(invoice);
        await _context.SaveChangesAsync();

        var saved = await _context.Invoices.FirstAsync(i => i.InvoiceNumber == "INV-TEST-001");
        saved.TotalAmount.Should().Be(1130m);
        saved.Status.Should().Be(InvoiceStatus.Draft);
    }

    [Fact]
    public async Task Product_CreatesWithCorrectSchema()
    {
        var product = new Product
        {
            Id = Guid.NewGuid(),
            Name = "Test Product",
            SKU = "SKU-001",
            CostPrice = 100m,
            SellingPrice = 150m,
            CurrentStock = 50,
            TenantId = _tenantService.GetTenantId()
        };

        await _context.Products.AddAsync(product);
        await _context.SaveChangesAsync();

        var saved = await _context.Products.FirstAsync(p => p.SKU == "SKU-001");
        saved.Name.Should().Be("Test Product");
        saved.CurrentStock.Should().Be(50);
    }

    [Fact]
    public async Task Employee_CreatesWithCorrectSchema()
    {
        var employee = new Employee
        {
            Id = Guid.NewGuid(),
            FirstName = "John",
            LastName = "Doe",
            Email = "john@example.com",
            BasicSalary = 50000m,
            Status = EmployeeStatus.Active,
            TenantId = _tenantService.GetTenantId()
        };

        await _context.Employees.AddAsync(employee);
        await _context.SaveChangesAsync();

        var saved = await _context.Employees.FirstAsync(e => e.Email == "john@example.com");
        saved.FirstName.Should().Be("John");
        saved.BasicSalary.Should().Be(50000m);
    }

    [Fact]
    public async Task Party_CreatesWithCorrectSchema()
    {
        var party = new Party
        {
            Id = Guid.NewGuid(),
            Name = "Test Customer",
            Phone = "9800000000",
            Type = PartyType.Customer,
            OpeningBalance = 0m,
            TenantId = _tenantService.GetTenantId()
        };

        await _context.Parties.AddAsync(party);
        await _context.SaveChangesAsync();

        var saved = await _context.Parties.FirstAsync(p => p.Phone == "9800000000");
        saved.Name.Should().Be("Test Customer");
        saved.Type.Should().Be(PartyType.Customer);
    }

    [Fact]
    public async Task Project_CreatesWithCorrectSchema()
    {
        var project = new Project
        {
            Id = Guid.NewGuid(),
            Name = "Test Project",
            Status = ProjectStatus.Planning,
            Budget = 100000m,
            TenantId = _tenantService.GetTenantId()
        };

        await _context.Projects.AddAsync(project);
        await _context.SaveChangesAsync();

        var saved = await _context.Projects.FirstAsync(p => p.Name == "Test Project");
        saved.Status.Should().Be(ProjectStatus.Planning);
        saved.Budget.Should().Be(100000m);
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
