# BizCore - Test-Driven Implementation Plan

## Executive Summary

Based on comprehensive codebase analysis, BizCore is a **production-ready multi-tenant ERP platform** with most features implemented. However, to make it **fully functional and test-driven**, the following work is required:

| Area | Status | Action Required |
|------|--------|-----------------|
| Backend Services | ✅ Implemented | Add unit tests |
| Frontend Pages | ✅ Mostly Complete | Fix TypeScript errors |
| TypeScript Build | ❌ Failing | Fix 12 errors |
| Unit Tests | ❌ Missing | Create test projects |
| Integration Tests | ❌ Missing | Add test infrastructure |
| E2E Tests | ❌ Missing | Add Playwright |
| FluentValidation | ❌ Missing | Add validators |
| CI/CD | ❌ Missing | Add pipelines |

---

## Phase 1: Fix TypeScript Build Errors (CRITICAL)

### Current Errors in Frontend

```bash
src/App.tsx(149,15): error TS6133: 'err' is declared but its value is never read.
src/components/layout/Sidebar.tsx(104,52): error TS2339: Property 'businessName' does not exist on type 'Business'.
src/pages/Dashboard.tsx(122,7): error TS2304: Cannot find name 'updateUser'.
src/pages/Settings.tsx(167,67): error TS2339: Property 'address' does not exist on type 'Business'.
src/pages/Settings.tsx(167,88): error TS2339: Property 'city' does not exist on type 'Business'.
src/pages/Settings.tsx(168,70): error TS2339: Property 'businessType' does not exist on type 'Business'.
src/pages/Settings.tsx(169,73): error TS2339: Property 'panNumber' does not exist on type 'Business'.
src/pages/Settings.tsx(169,97): error TS2339: Property 'panNumber' does not exist on type 'Business'.
src/pages/Settings.tsx(169,119): error TS2339: Property 'isVATRegistered' does not exist on type 'Business'.
src/pages/Settings.tsx(170,53): error TS2322: Type 'string | null | undefined' is not assignable to type 'string'.
src/pages/Settings.tsx(172,70): error TS2339: Property 'currency' does not exist on type 'Business'.
```

### Root Cause Analysis

The `Business` interface in `useAuthStore.ts` is **out of sync** with the actual `Business` entity in `BizCore.Domain/Entities/Business.cs`.

**Backend Business Entity (complete):**
```csharp
public class Business : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BusinessType { get; set; } = "Other";
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? PANNumber { get; set; }
    public bool IsVATRegistered { get; set; }
    public string? VATNumber { get; set; }
    public string Currency { get; set; } = "NPR";
    // ... more fields
}
```

**Frontend Business Interface (incomplete):**
```typescript
interface Business {
  id: string;
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  // MISSING: address, city, businessType, panNumber, isVATRegistered, currency, etc.
}
```

### Fix Implementation

**File: `bizcore-web/src/store/useAuthStore.ts`**

Replace the incomplete `Business` interface with:

```typescript
interface Business {
  id: string;
  tenantId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  businessType?: string;
  panNumber?: string | null;
  isVATRegistered?: boolean;
  vatNumber?: string | null;
  currency?: string;
  logoUrl?: string | null;
  website?: string | null;
  description?: string | null;
}
```

**File: `bizcore-web/src/pages/Settings.tsx`**

Add null-safe handling:
```typescript
// Replace direct property access with optional chaining
<div>{business?.address ?? 'N/A'}</div>
<div>{business?.city ?? 'N/A'}</div>
```

**File: `bizcore-web/src/App.tsx`**

Fix unused variable:
```typescript
// Replace
} catch (err) {
// With
} catch {
// Or
} catch (_err) {
```

**File: `bizcore-web/src/pages/Dashboard.tsx`**

Fix `updateUser` reference - likely needs to import from auth store:
```typescript
import { useAuthStore } from '@/store/useAuthStore';
const { updateUser } = useAuthStore();
```

---

## Phase 2: Test Infrastructure Setup

### 2.1 Create Test Projects

```bash
# Create solution folders
mkdir -p tests/BizCore.UnitTests
mkdir -p tests/BizCore.IntegrationTests
mkdir -p tests/BizCore.ApiTests
mkdir -p tests/BizCore.E2ETests
```

### 2.2 Unit Test Project (.NET)

**File: `tests/BizCore.UnitTests/BizCore.UnitTests.csproj`**

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.0" />
    <PackageReference Include="xunit" Version="2.9.0" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="NSubstitute" Version="5.1.0" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.InMemory" Version="8.0.0" />
    <PackageReference Include="coverlet.collector" Version="6.0.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\BizCore.Application\BizCore.Application.csproj" />
    <ProjectReference Include="..\..\BizCore.Domain\BizCore.Domain.csproj" />
    <ProjectReference Include="..\..\BizCore.Infrastructure\BizCore.Infrastructure.csproj" />
  </ItemGroup>
</Project>
```

### 2.3 Integration Test Project (.NET)

**File: `tests/BizCore.IntegrationTests/BizCore.IntegrationTests.csproj`**

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <ImplicitUsings>enable</ImplicitUsings>
    <Nullable>enable</Nullable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.Mvc.Testing" Version="8.0.0" />
    <PackageReference Include="Microsoft.NET.Test.Sdk" Version="17.11.0" />
    <PackageReference Include="xunit" Version="2.9.0" />
    <PackageReference Include="xunit.runner.visualstudio" Version="2.8.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
    <PackageReference Include="NSubstitute" Version="5.1.0" />
    <PackageReference Include="FluentAssertions" Version="6.12.0" />
    <PackageReference Include="Npgsql.EntityFrameworkCore.PostgreSQL" Version="8.0.0" />
    <PackageReference Include="Testcontainers.PostgreSql" Version="3.10.0" />
    <PackageReference Include="coverlet.collector" Version="6.0.2">
      <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\BizCore.API\BizCore.API.csproj" />
  </ItemGroup>
</Project>
```

### 2.4 E2E Test Project (Playwright)

**File: `tests/BizCore.E2ETests/package.json`**

```json
{
  "name": "bizcore-e2e-tests",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/node": "^22.0.0"
  }
}
```

**File: `tests/BizCore.E2ETests/playwright.config.ts`**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: [
    {
      command: 'cd ../../bizcore-web && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../../BizCore.API && dotnet run',
      url: 'http://localhost:5011',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## Phase 3: Write Unit Tests (TDD Approach)

### 3.1 Domain Entity Tests

**File: `tests/BizCore.UnitTests/Domain/Entities/`**

```csharp
// InvoiceTests.cs
public class InvoiceTests
{
    [Fact]
    public void Invoice_NewInvoice_HasDraftStatus()
    {
        // Arrange & Act
        var invoice = new Invoice();

        // Assert
        invoice.Status.Should().Be(InvoiceStatus.Draft);
    }

    [Fact]
    public void Invoice_AddItems_CalculatesTotalCorrectly()
    {
        // Arrange
        var invoice = new Invoice();
        var item1 = new InvoiceItem { UnitPrice = 100m, Quantity = 2, Amount = 200m };
        var item2 = new InvoiceItem { UnitPrice = 50m, Quantity = 1, Amount = 50m };

        // Act
        invoice.Items.Add(item1);
        invoice.Items.Add(item2);
        invoice.SubTotal = 250m;
        invoice.TaxAmount = 25m;
        invoice.TotalAmount = 275m;

        // Assert
        invoice.TotalAmount.Should().Be(275m);
        invoice.Items.Should().HaveCount(2);
    }

    [Theory]
    [InlineData(InvoiceStatus.Draft)]
    [InlineData(InvoiceStatus.Sent)]
    [InlineData(InvoiceStatus.Paid)]
    [InlineData(InvoiceStatus.Overdue)]
    public void Invoice_SetStatus_ReturnsCorrectStatus(InvoiceStatus status)
    {
        // Arrange
        var invoice = new Invoice();

        // Act
        invoice.Status = status;

        // Assert
        invoice.Status.Should().Be(status);
    }
}
```

### 3.2 Application Service Tests

**File: `tests/BizCore.UnitTests/Application/Services/`**

```csharp
// InvoiceServiceTests.cs
public class InvoiceServiceTests
{
    private readonly AppDbContext _context;
    private readonly InvoiceService _service;
    private readonly Guid _tenantId = Guid.NewGuid();

    public InvoiceServiceTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);
        _service = new InvoiceService(_context, null); // Mock other deps
    }

    [Fact]
    public async Task CreateInvoice_WithValidDto_ReturnsSuccessResponse()
    {
        // Arrange
        var dto = new CreateInvoiceDto
        {
            CustomerId = Guid.NewGuid(),
            IssueDate = DateTime.UtcNow,
            DueDate = DateTime.UtcNow.AddDays(30),
            Items = new List<CreateInvoiceItemDto>
            {
                new() { ProductId = Guid.NewGuid(), Quantity = 2, UnitPrice = 100 }
            }
        };

        // Act
        var result = await _service.CreateAsync(dto, _tenantId);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.Status.Should().Be(InvoiceStatus.Draft);
    }

    [Fact]
    public async Task GetAllAsync_WithTenantFilter_ReturnsOnlyTenantInvoices()
    {
        // Arrange
        var tenant1Invoices = new List<Invoice>
        {
            new() { TenantId = _tenantId, InvoiceNumber = "INV-001" },
            new() { TenantId = _tenantId, InvoiceNumber = "INV-002" },
        };
        var tenant2Invoices = new List<Invoice>
        {
            new() { TenantId = Guid.NewGuid(), InvoiceNumber = "INV-003" },
        };

        await _context.Invoices.AddRangeAsync(tenant1Invoices);
        await _context.Invoices.AddRangeAsync(tenant2Invoices);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.GetAllAsync(null, null, null, null, _tenantId);

        // Assert
        result.Success.Should().BeTrue();
        result.Data.Should().HaveCount(2);
        result.Data!.All(i => i.TenantId == _tenantId).Should().BeTrue();
    }

    [Fact]
    public async Task MarkPaidAsync_WithValidId_UpdatesStatusToPaid()
    {
        // Arrange
        var invoice = new Invoice
        {
            TenantId = _tenantId,
            Status = InvoiceStatus.Sent,
            TotalAmount = 1000m
        };
        await _context.Invoices.AddAsync(invoice);
        await _context.SaveChangesAsync();

        // Act
        var result = await _service.MarkPaidAsync(invoice.Id, _tenantId);

        // Assert
        result.Success.Should().BeTrue();
        result.Data!.Status.Should().Be(InvoiceStatus.Paid);
    }
}
```

### 3.3 Controller Tests

**File: `tests/BizCore.UnitTests/API/Controllers/`**

```csharp
// InvoicesControllerTests.cs
public class InvoicesControllerTests
{
    private readonly Mock<IInvoiceService> _invoiceServiceMock;
    private readonly InvoicesController _controller;

    public InvoicesControllerTests()
    {
        _invoiceServiceMock = new Mock<IInvoiceService>();
        _controller = new InvoicesController(_invoiceServiceMock.Object);
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithInvoices()
    {
        // Arrange
        var invoices = new List<InvoiceDto>
        {
            new() { Id = Guid.NewGuid(), InvoiceNumber = "INV-001" },
            new() { Id = Guid.NewGuid(), InvoiceNumber = "INV-002" },
        };
        _invoiceServiceMock
            .Setup(s => s.GetAllAsync(null, null, null, null, It.IsAny<Guid>()))
            .ReturnsAsync(ApiResponse<List<InvoiceDto>>.SuccessResult(invoices));

        // Act
        var result = await _controller.GetAll(null, null, null, null);

        // Assert
        var okResult = result.Result.Should().BeOfType<OkObjectResult>().Subject;
        var response = okResult.Value.Should().BeOfType<ApiResponse<List<InvoiceDto>>>().Subject;
        response.Success.Should().BeTrue();
        response.Data.Should().HaveCount(2);
    }

    [Fact]
    public async Task Create_WithInvalidDto_ReturnsBadRequest()
    {
        // Arrange
        var dto = new CreateInvoiceDto(); // Invalid - missing required fields
        _invoiceServiceMock
            .Setup(s => s.CreateAsync(dto, It.IsAny<Guid>()))
            .ReturnsAsync(ApiResponse<InvoiceDto>.FailResult("Invalid invoice"));

        // Act
        var result = await _controller.Create(dto);

        // Assert
        result.Result.Should().BeOfType<BadRequestObjectResult>();
    }
}
```

---

## Phase 4: Write Integration Tests

### 4.1 Database Integration Tests

**File: `tests/BizCore.IntegrationTests/Infrastructure/`**

```csharp
// AppDbContextTests.cs
public class AppDbContextTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _container;
    private AppDbContext _context = null!;

    public AppDbContextTests()
    {
        _container = new PostgreSqlBuilder()
            .WithImage("postgres:16-alpine")
            .Build();
    }

    public async Task InitializeAsync()
    {
        await _container.StartAsync();
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_container.GetConnectionString())
            .Options;
        _context = new AppDbContext(options);
        await _context.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _context.DisposeAsync();
        await _container.DisposeAsync();
    }

    [Fact]
    public async Task Invoice_CreatesWithCorrectSchema()
    {
        // Arrange
        var invoice = new Invoice
        {
            TenantId = Guid.NewGuid(),
            InvoiceNumber = "INV-TEST-001",
            CustomerId = Guid.NewGuid(),
            SubTotal = 1000m,
            TaxAmount = 130m,
            TotalAmount = 1130m,
            Status = InvoiceStatus.Draft
        };

        // Act
        await _context.Invoices.AddAsync(invoice);
        await _context.SaveChangesAsync();

        // Assert
        var saved = await _context.Invoices.FirstAsync(i => i.InvoiceNumber == "INV-TEST-001");
        saved.TotalAmount.Should().Be(1130m);
        saved.Status.Should().Be(InvoiceStatus.Draft);
    }

    [Fact]
    public async Task TenantFilter_OnlyReturnsTenantData()
    {
        // Arrange
        var tenant1 = Guid.NewGuid();
        var tenant2 = Guid.NewGuid();

        await _context.Invoices.AddRangeAsync(new[]
        {
            new Invoice { TenantId = tenant1, InvoiceNumber = "T1-001" },
            new Invoice { TenantId = tenant1, InvoiceNumber = "T1-002" },
            new Invoice { TenantId = tenant2, InvoiceNumber = "T2-001" },
        });
        await _context.SaveChangesAsync();

        // Act - Simulate tenant filter
        var tenant1Invoices = await _context.Invoices
            .IgnoreQueryFilters()
            .Where(i => i.TenantId == tenant1)
            .ToListAsync();

        // Assert
        tenant1Invoices.Should().HaveCount(2);
        tenant1Invoices.All(i => i.TenantId == tenant1).Should().BeTrue();
    }
}
```

### 4.2 API Integration Tests

**File: `tests/BizCore.IntegrationTests/API/`**

```csharp
// AuthControllerTests.cs
public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly CustomWebApplicationFactory _factory;

    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
        _client = _factory.CreateClient();
    }

    [Fact]
    public async Task Register_WithValidData_ReturnsToken()
    {
        // Arrange
        var registerDto = new RegisterDto
        {
            Email = $"test-{Guid.NewGuid()}@example.com",
            Password = "TestPassword123",
            FirstName = "Test",
            LastName = "User"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", registerDto);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.OK);
        var result = await response.Content.ReadFromJsonAsync<ApiResponse<AuthResponseDto>>();
        result.Should().NotBeNull();
        result!.Success.Should().BeTrue();
        result.Data.Should().NotBeNull();
        result.Data!.AccessToken.Should().NotBeNullOrEmpty();
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var loginDto = new LoginDto
        {
            Email = "nonexistent@example.com",
            Password = "WrongPassword"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);

        // Assert
        response.StatusCode.Should().Be(System.Net.HttpStatusCode.Unauthorized);
    }
}
```

---

## Phase 5: Write E2E Tests

### 5.1 Authentication Flow Tests

**File: `tests/BizCore.E2ETests/tests/auth.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('login flow with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('AdminPassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('login flow with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email').fill('invalid@example.com');
    await page.getByLabel('Password').fill('WrongPassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('protected routes redirect to login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
```

### 5.2 Inventory Flow Tests

**File: `tests/BizCore.E2ETests/tests/inventory.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test.describe('Inventory Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('AdminPassword123');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await page.waitForURL('/dashboard');
  });

  test('create new product', async ({ page }) => {
    await page.goto('/inventory');
    
    await page.getByRole('button', { name: 'Add Product' }).click();
    await page.getByLabel('Product Name').fill('Test Product');
    await page.getByLabel('SKU').fill('SKU-001');
    await page.getByLabel('Cost Price').fill('100');
    await page.getByLabel('Selling Price').fill('150');
    await page.getByRole('button', { name: 'Save' }).click();
    
    await expect(page.getByText('Test Product')).toBeVisible();
  });

  test('stock adjustment updates quantity', async ({ page }) => {
    await page.goto('/inventory');
    
    // Find product and click adjust
    await page.getByText('SKU-001').click();
    await page.getByRole('button', { name: 'Adjust Stock' }).click();
    await page.getByLabel('Quantity').fill('50');
    await page.getByLabel('Note').fill('Initial stock');
    await page.getByRole('button', { name: 'Confirm' }).click();
    
    await expect(page.getByText('Current Stock: 50')).toBeVisible();
  });
});
```

---

## Phase 6: Add FluentValidation

### 6.1 Validator Implementation

**File: `BizCore.Application/Validators/`**

```csharp
// CreateInvoiceDtoValidator.cs
public class CreateInvoiceDtoValidator : AbstractValidator<CreateInvoiceDto>
{
    public CreateInvoiceDtoValidator()
    {
        RuleFor(x => x.CustomerId)
            .NotEmpty().WithMessage("Customer is required");

        RuleFor(x => x.IssueDate)
            .NotEmpty().WithMessage("Issue date is required")
            .LessThanOrEqualTo(DateTime.UtcNow.AddDays(1))
            .WithMessage("Issue date cannot be in the future");

        RuleFor(x => x.DueDate)
            .NotEmpty().WithMessage("Due date is required")
            .GreaterThan(x => x.IssueDate)
            .WithMessage("Due date must be after issue date");

        RuleFor(x => x.Items)
            .NotEmpty().WithMessage("At least one item is required");

        RuleForEach(x => x.Items).SetValidator(new CreateInvoiceItemDtoValidator());
    }
}

public class CreateInvoiceItemDtoValidator : AbstractValidator<CreateInvoiceItemDto>
{
    public CreateInvoiceItemDtoValidator()
    {
        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Quantity must be greater than 0");

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("Unit price must be greater than 0");
    }
}
```

### 6.2 Wire Validators in Program.cs

```csharp
// In Program.cs, add after services configuration:
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateInvoiceDtoValidator>();
```

---

## Phase 7: CI/CD Pipeline

### 7.1 GitHub Actions Workflow

**File: `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  DOTNET_VERSION: '8.0.x'
  NODE_VERSION: '20.x'

jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: bizcore_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup .NET
        uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - name: Restore dependencies
        run: dotnet restore

      - name: Build
        run: dotnet build --no-restore

      - name: Unit Tests
        run: dotnet test tests/BizCore.UnitTests --verbosity normal

      - name: Integration Tests
        run: dotnet test tests/BizCore.IntegrationTests --verbosity normal
        env:
          ConnectionStrings__DefaultConnection: 'Host=localhost;Port=5432;Database=bizcore_test;Username=test;Password=test'

  frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Type check
        run: npm run typecheck

      - name: Lint
        run: npm run lint

      - name: Build
        run: npm run build

  e2e:
    runs-on: ubuntu-latest
    needs: [backend, frontend]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test
        working-directory: tests/BizCore.E2ETests
```

---

## Phase 8: End-to-End Verification Checklist

### 8.1 Pre-Flight Checks

```bash
# 1. Verify backend builds
cd BizCore.API && dotnet build

# 2. Verify frontend builds
cd bizcore-web && npm run build

# 3. Run unit tests
dotnet test tests/BizCore.UnitTests

# 4. Run integration tests
dotnet test tests/BizCore.IntegrationTests

# 5. Run E2E tests
npm run test
```

### 8.2 Manual Test Scenarios

| Feature | Test Scenario | Expected Result |
|---------|--------------|----------------|
| Auth - Register | New user registration | User created, token returned |
| Auth - Login | Valid credentials | Redirect to dashboard |
| Auth - Login | Invalid credentials | Error message displayed |
| Dashboard | Load as Admin | Admin dashboard with KPIs |
| Inventory - Products | Create product | Product in list |
| Inventory - Stock | Adjust stock | Quantity updated |
| Invoices - Create | Create invoice | Invoice number generated |
| Invoices - PDF | Generate PDF | PDF downloads |
| POS - Session | Open session | Session active |
| POS - Transaction | Complete sale | Inventory decremented |
| HR - Employee | Add employee | Employee in list |
| HR - Attendance | Mark attendance | Attendance recorded |
| Payroll - Process | Generate payroll | Salary calculated |
| Multi-tenancy | User from Tenant A | Cannot see Tenant B data |

---

## Implementation Timeline

| Phase | Task | Effort | Priority |
|-------|------|--------|----------|
| 1 | Fix TypeScript errors | 1 hour | P0 |
| 2 | Setup test projects | 2 hours | P0 |
| 3 | Write domain tests | 4 hours | P1 |
| 4 | Write service tests | 8 hours | P1 |
| 5 | Write controller tests | 4 hours | P1 |
| 6 | Setup integration tests | 4 hours | P2 |
| 7 | Write E2E tests | 8 hours | P2 |
| 8 | Add FluentValidation | 4 hours | P2 |
| 9 | Setup CI/CD | 4 hours | P2 |
| 10 | E2E verification | 2 hours | P1 |

**Total Estimated Time: ~41 hours**

---

## Next Steps

1. **Immediate**: Fix TypeScript build errors in `useAuthStore.ts`, `Settings.tsx`, `App.tsx`, `Dashboard.tsx`
2. **This week**: Create test projects and write unit tests for core services
3. **Next week**: Add integration tests and E2E tests
4. **Ongoing**: Add CI/CD pipeline and monitor test coverage

---

## Files to Create/Modify

### Create (New Files)
- `tests/BizCore.UnitTests/BizCore.UnitTests.csproj`
- `tests/BizCore.UnitTests/Domain/Entities/InvoiceTests.cs`
- `tests/BizCore.UnitTests/Application/Services/InvoiceServiceTests.cs`
- `tests/BizCore.IntegrationTests/BizCore.IntegrationTests.csproj`
- `tests/BizCore.IntegrationTests/Infrastructure/AppDbContextTests.cs`
- `tests/BizCore.E2ETests/package.json`
- `tests/BizCore.E2ETests/playwright.config.ts`
- `tests/BizCore.E2ETests/tests/auth.spec.ts`
- `tests/BizCore.E2ETests/tests/inventory.spec.ts`
- `BizCore.Application/Validators/CreateInvoiceDtoValidator.cs`
- `.github/workflows/ci.yml`

### Modify (Existing Files)
- `bizcore-web/src/store/useAuthStore.ts` - Fix Business interface
- `bizcore-web/src/pages/Settings.tsx` - Fix property access
- `bizcore-web/src/App.tsx` - Fix unused variable
- `bizcore-web/src/pages/Dashboard.tsx` - Fix updateUser import
- `BizCore.API/Program.cs` - Add FluentValidation
