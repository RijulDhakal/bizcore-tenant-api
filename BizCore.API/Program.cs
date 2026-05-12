using System.Text;
using System.Text.Json;
using AspNetCoreRateLimit;
using BizCore.API.Middleware;
using BizCore.Application.Interfaces;
using BizCore.Infrastructure.Services;
using BizCore.Domain.Entities;
using BizCore.Infrastructure.Data;
using BizCore.Infrastructure.Application.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

var builder = WebApplication.CreateBuilder(args);

// --- Infrastructure ---
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();

// --- Database ---
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDbContext<PlatformDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("MainConnection")
        ?? builder.Configuration.GetConnectionString("DefaultConnection")));

// --- Identity ---
builder.Services.AddIdentity<ApplicationUser, IdentityRole<Guid>>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 8;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<AppDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddScoped<IPasswordHasher<ApplicationUser>, BCryptPasswordHasher>();

// --- JWT Auth ---
var jwtKey = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ValidateIssuer = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidateAudience = true,
        ValidAudience = builder.Configuration["Jwt:Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero,
        // Tell ASP.NET which claim to use for [Authorize(Roles = "...")] checks
        // This is needed because DefaultInboundClaimTypeMap is cleared above
        RoleClaimType = "role",
        NameClaimType = "email"
    };
});

// --- Rate Limiting ---
builder.Services.AddMemoryCache();
builder.Services.Configure<IpRateLimitOptions>(builder.Configuration.GetSection("IpRateLimiting"));
builder.Services.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
builder.Services.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
builder.Services.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
builder.Services.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
builder.Services.AddInMemoryRateLimiting();

// --- CORS ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:5175",
                "http://localhost:4173",
                "http://localhost:4174"
            )
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// --- DI: Scoped Services ---
builder.Services.AddScoped<ITenantService, TenantService>();
builder.Services.AddScoped<ITenantDbConnectionFactory, TenantDbConnectionFactory>();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IBusinessService, BusinessService>();
builder.Services.AddScoped<IKhataService, KhataService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();
builder.Services.AddScoped<IReportService, ReportService>();
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();
builder.Services.AddScoped<IPOSService, POSService>();
builder.Services.AddScoped<IHRService, HRService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();
builder.Services.AddScoped<IBankingService, BankingService>();
builder.Services.AddScoped<IDamagedGoodsService, DamagedGoodsService>();
builder.Services.AddScoped<IModuleService, ModuleService>();
builder.Services.AddScoped<IPermissionService, PermissionService>();
builder.Services.AddScoped<IMerchantService, MerchantService>();
builder.Services.AddScoped<IDeliveryPartnerService, DeliveryPartnerService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Tenant directory (SuperAdmin MAIN DB) access via HTTP
builder.Services.AddHttpClient<ITenantDirectoryClient, SuperAdminApiTenantDirectoryClient>();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "BizCore API", Version = "v1", Description = "BizCore ERP + Digital Khata API" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT Bearer token"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// --- Middleware Pipeline ---
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "BizCore API v1"));
}

if (!app.Environment.IsDevelopment())
{
    app.UseIpRateLimiting();
}
app.UseCors("AllowAll");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseMiddleware<TenantMiddleware>();
app.UseAuthorization();
app.MapControllers();

// --- Auto-migrate on startup ---
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var platformDb = scope.ServiceProvider.GetRequiredService<PlatformDbContext>();
    var tenantDirectory = scope.ServiceProvider.GetRequiredService<ITenantDirectoryClient>();

    var migrateAppDb =
        (app.Configuration["MIGRATE_APP_DB"] ?? "false").Equals("true", StringComparison.OrdinalIgnoreCase) ||
        (app.Configuration["MigrateAppDb"] ?? "false").Equals("true", StringComparison.OrdinalIgnoreCase);

    if (migrateAppDb)
    {
        await db.Database.MigrateAsync();
    }

    // IMPORTANT: Tenant App must not create/update MAIN DB schema.
    // SuperAdmin owns MAIN DB migrations. Opt-in only for dev/troubleshooting.
    var migratePlatformDb =
        (app.Configuration["MIGRATE_PLATFORM_DB"] ?? "").Equals("true", StringComparison.OrdinalIgnoreCase) ||
        (app.Configuration["MigratePlatformDb"] ?? "").Equals("true", StringComparison.OrdinalIgnoreCase);

    if (migratePlatformDb)
    {
        await platformDb.Database.MigrateAsync();
    }

    var realTenantId = await db.Users
        .Where(u => !u.IsDeleted && u.CurrentTenantId != Guid.Empty)
        .Select(u => u.CurrentTenantId)
        .FirstOrDefaultAsync();

    if (realTenantId != Guid.Empty)
    {
        var emptyGuid = Guid.Empty;

        var updatedTransactions = await db.POSTransactions
            .Where(t => t.TenantId == emptyGuid)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.TenantId, realTenantId));

        var updatedSessions = await db.POSSessions
            .Where(s => s.TenantId == emptyGuid)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.TenantId, realTenantId));

        var updatedMovements = await db.StockMovements
            .Where(s => s.TenantId == emptyGuid)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.TenantId, realTenantId));

        var updatedMerchants = await db.Merchants
            .Where(m => m.TenantId == emptyGuid)
            .ExecuteUpdateAsync(m => m.SetProperty(t => t.TenantId, realTenantId));
            
        var updatedDeliveryPartners = await db.DeliveryPartners
            .Where(d => d.TenantId == emptyGuid)
            .ExecuteUpdateAsync(d => d.SetProperty(t => t.TenantId, realTenantId));

        Console.WriteLine($"[Startup] Fixed empty TenantIds for tenant: {realTenantId}. Transactions={updatedTransactions}, Sessions={updatedSessions}, StockMovements={updatedMovements}, Merchants={updatedMerchants}, DeliveryPartners={updatedDeliveryPartners}");
    }

    // --- Seed Modules (platform DB) ---
    // Only run when explicitly allowed, since MAIN DB schema/data is owned by SuperAdmin.
    if (migratePlatformDb)
    {
        if (!await platformDb.Modules.AnyAsync())
        {
            var modules = new[]
            {
                new BizCore.Domain.Entities.Module { Name = "Dashboard", Code = "dashboard", Description = "Main dashboard overview", Icon = "LayoutDashboard", SortOrder = 0, IsActive = true, IsCore = true },
                new BizCore.Domain.Entities.Module { Name = "Point of Sale", Code = "pos", Description = "POS terminal and transactions", Icon = "Monitor", SortOrder = 1, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "Invoices", Code = "invoices", Description = "Invoice management", Icon = "FileText", SortOrder = 2, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "Inventory", Code = "inventory", Description = "Product and stock management", Icon = "Package", SortOrder = 3, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "Purchase", Code = "purchase", Description = "Purchase orders", Icon = "ShoppingCart", SortOrder = 4, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "Expenses", Code = "expenses", Description = "Expense tracking", Icon = "CreditCard", SortOrder = 5, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "Digital Khata", Code = "khata", Description = "Digital ledger", Icon = "BookOpen", SortOrder = 6, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "Reports", Code = "reports", Description = "Business analytics and reports", Icon = "BarChart2", SortOrder = 7, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "HR", Code = "hr", Description = "Human resources management", Icon = "UserCheck", SortOrder = 8, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "Projects", Code = "projects", Description = "Project management", Icon = "KanbanSquare", SortOrder = 9, IsActive = true },
                new BizCore.Domain.Entities.Module { Name = "Settings", Code = "settings", Description = "System settings", Icon = "Settings", SortOrder = 10, IsActive = true, IsCore = true },
            };
            platformDb.Modules.AddRange(modules);
            await platformDb.SaveChangesAsync();
            Console.WriteLine($"[Startup] Seeded {modules.Length} default modules");

            // Enable all modules for all existing tenants
            var superAdminBaseUrl = app.Configuration["SuperAdminApi:BaseUrl"];
            if (string.IsNullOrWhiteSpace(superAdminBaseUrl))
            {
                Console.WriteLine("[Startup] Skipping tenant module enablement: SuperAdminApi:BaseUrl not configured.");
            }
            else
            {
                var tenantIds = (await tenantDirectory.ListTenantsAsync()).Select(t => t.TenantId).Distinct().ToList();
                foreach (var tid in tenantIds)
                {
                    foreach (var mod in modules)
                    {
                        platformDb.TenantModules.Add(new BizCore.Domain.Entities.TenantModule
                        {
                            TenantId = tid,
                            ModuleId = mod.Id,
                            IsEnabled = true
                        });
                    }
                }
                await platformDb.SaveChangesAsync();
                Console.WriteLine($"[Startup] Enabled all modules for {tenantIds.Count} existing tenants");
            }
        }
        else
        {
            // Update core flags for existing modules
            var dashboard = await platformDb.Modules.FirstOrDefaultAsync(m => m.Code == "dashboard");
            if (dashboard != null) dashboard.IsCore = true;
            var settings = await platformDb.Modules.FirstOrDefaultAsync(m => m.Code == "settings");
            if (settings != null) settings.IsCore = true;
            await platformDb.SaveChangesAsync();
        }
    }

    // --- Seed Defaults (Units, ExpenseCategories, LeaveTypes) ---
    var businessTenantIds = new List<Guid>();
    try
    {
        businessTenantIds = (await tenantDirectory.ListTenantsAsync()).Select(t => t.TenantId).Distinct().ToList();
    }
    catch
    {
        Console.WriteLine("[Startup] Skipping tenant defaults seeding: tenant directory not reachable/configured.");
    }

    foreach (var tid in businessTenantIds)
    {
        var hasUnits = await db.Units.IgnoreQueryFilters().AnyAsync(u => !u.IsDeleted && u.TenantId == tid);
        if (!hasUnits)
        {
            var piece = new BizCore.Domain.Entities.Unit { Id = Guid.NewGuid(), TenantId = tid, Name = "Piece", Code = "PCS", Symbol = "pcs", IsBaseUnit = true, ConversionFactor = 1m };
            var kilogram = new BizCore.Domain.Entities.Unit { Id = Guid.NewGuid(), TenantId = tid, Name = "Kilogram", Code = "KG", Symbol = "kg", IsBaseUnit = true, ConversionFactor = 1m };
            var gram = new BizCore.Domain.Entities.Unit { Id = Guid.NewGuid(), TenantId = tid, Name = "Gram", Code = "G", Symbol = "g", IsBaseUnit = false, ConversionFactor = 0.001m, BaseUnitId = kilogram.Id };
            var liter = new BizCore.Domain.Entities.Unit { Id = Guid.NewGuid(), TenantId = tid, Name = "Liter", Code = "L", Symbol = "l", IsBaseUnit = true, ConversionFactor = 1m };
            var meter = new BizCore.Domain.Entities.Unit { Id = Guid.NewGuid(), TenantId = tid, Name = "Meter", Code = "M", Symbol = "m", IsBaseUnit = true, ConversionFactor = 1m };
            var box = new BizCore.Domain.Entities.Unit { Id = Guid.NewGuid(), TenantId = tid, Name = "Box", Code = "BOX", Symbol = "box", IsBaseUnit = true, ConversionFactor = 1m };
            var dozen = new BizCore.Domain.Entities.Unit { Id = Guid.NewGuid(), TenantId = tid, Name = "Dozen", Code = "DOZ", Symbol = "doz", IsBaseUnit = true, ConversionFactor = 12m };
            var carton = new BizCore.Domain.Entities.Unit { Id = Guid.NewGuid(), TenantId = tid, Name = "Carton", Code = "CTN", Symbol = "ctn", IsBaseUnit = true, ConversionFactor = 1m };

            db.Units.AddRange(piece, kilogram, gram, liter, meter, box, dozen, carton);
            await db.SaveChangesAsync();
            Console.WriteLine($"[Startup] Seeded default units for tenant {tid}");
        }

        var hasExpenseCategories = await db.ExpenseCategories.IgnoreQueryFilters().AnyAsync(c => !c.IsDeleted && c.TenantId == tid);
        if (!hasExpenseCategories)
        {
            db.ExpenseCategories.AddRange(
                new BizCore.Domain.Entities.ExpenseCategory { Id = Guid.NewGuid(), TenantId = tid, Name = "Rent", Code = "RENT", Level = 0, Path = "RENT" },
                new BizCore.Domain.Entities.ExpenseCategory { Id = Guid.NewGuid(), TenantId = tid, Name = "Utilities", Code = "UTIL", Level = 0, Path = "UTIL" },
                new BizCore.Domain.Entities.ExpenseCategory { Id = Guid.NewGuid(), TenantId = tid, Name = "Salary", Code = "SAL", Level = 0, Path = "SAL" },
                new BizCore.Domain.Entities.ExpenseCategory { Id = Guid.NewGuid(), TenantId = tid, Name = "Marketing", Code = "MKT", Level = 0, Path = "MKT" },
                new BizCore.Domain.Entities.ExpenseCategory { Id = Guid.NewGuid(), TenantId = tid, Name = "Travel", Code = "TRV", Level = 0, Path = "TRV" },
                new BizCore.Domain.Entities.ExpenseCategory { Id = Guid.NewGuid(), TenantId = tid, Name = "Office Supplies", Code = "OFS", Level = 0, Path = "OFS" },
                new BizCore.Domain.Entities.ExpenseCategory { Id = Guid.NewGuid(), TenantId = tid, Name = "Maintenance", Code = "MNT", Level = 0, Path = "MNT" },
                new BizCore.Domain.Entities.ExpenseCategory { Id = Guid.NewGuid(), TenantId = tid, Name = "Tax", Code = "TAX", Level = 0, Path = "TAX" }
            );
            await db.SaveChangesAsync();
            Console.WriteLine($"[Startup] Seeded default expense categories for tenant {tid}");
        }

        var hasLeaveTypes = await db.LeaveTypes.IgnoreQueryFilters().AnyAsync(lt => !lt.IsDeleted && lt.TenantId == tid);
        if (!hasLeaveTypes)
        {
            db.LeaveTypes.AddRange(
                new BizCore.Domain.Entities.LeaveTypeConfig { Id = Guid.NewGuid(), TenantId = tid, Name = "Annual Leave", Code = "AL", DaysPerYear = 20, IsPaid = true, CarryForward = true, MaxCarryForward = 10, RequiresApproval = true },
                new BizCore.Domain.Entities.LeaveTypeConfig { Id = Guid.NewGuid(), TenantId = tid, Name = "Sick Leave", Code = "SL", DaysPerYear = 12, IsPaid = true, CarryForward = false, MaxCarryForward = 0, RequiresApproval = true },
                new BizCore.Domain.Entities.LeaveTypeConfig { Id = Guid.NewGuid(), TenantId = tid, Name = "Casual Leave", Code = "CL", DaysPerYear = 6, IsPaid = true, CarryForward = false, MaxCarryForward = 0, RequiresApproval = true },
                new BizCore.Domain.Entities.LeaveTypeConfig { Id = Guid.NewGuid(), TenantId = tid, Name = "Bereavement Leave", Code = "BL", DaysPerYear = 5, IsPaid = true, CarryForward = false, MaxCarryForward = 0, RequiresApproval = true },
                new BizCore.Domain.Entities.LeaveTypeConfig { Id = Guid.NewGuid(), TenantId = tid, Name = "Maternity Leave", Code = "ML", DaysPerYear = 90, IsPaid = true, CarryForward = false, MaxCarryForward = 0, RequiresApproval = true },
                new BizCore.Domain.Entities.LeaveTypeConfig { Id = Guid.NewGuid(), TenantId = tid, Name = "Paternity Leave", Code = "PL", DaysPerYear = 15, IsPaid = true, CarryForward = false, MaxCarryForward = 0, RequiresApproval = true }
            );
            await db.SaveChangesAsync();
            Console.WriteLine($"[Startup] Seeded default leave types for tenant {tid}");
        }
    }

    // Ensure Accountant has POS.View if already seeded
    var accountantRole = await platformDb.RolePermissions
        .Include(rp => rp.Permission)
        .FirstOrDefaultAsync(rp => rp.RoleName == "Accountant" && rp.Permission.Code == "POS.View");

    if (accountantRole == null)
    {
        var posView = await platformDb.Permissions.FirstOrDefaultAsync(p => p.Code == "POS.View");
        if (posView != null)
        {
            platformDb.RolePermissions.Add(new BizCore.Domain.Entities.RolePermission { RoleName = "Accountant", PermissionId = posView.Id });
            await platformDb.SaveChangesAsync();
            Console.WriteLine("[Startup] Fixed Accountant role: Added POS.View permission");
        }
    }

    // --- Seed Permissions ---
    if (!await platformDb.Permissions.AnyAsync())
    {
        var permissions = new[]
        {
            // POS
            new BizCore.Domain.Entities.Permission { Code = "POS.View", ModuleCode = "pos", Description = "View POS" },
            new BizCore.Domain.Entities.Permission { Code = "POS.Create", ModuleCode = "pos", Description = "Create POS transactions" },
            new BizCore.Domain.Entities.Permission { Code = "POS.Refund", ModuleCode = "pos", Description = "Process refunds" },
            // Invoices
            new BizCore.Domain.Entities.Permission { Code = "Invoices.View", ModuleCode = "invoices", Description = "View invoices" },
            new BizCore.Domain.Entities.Permission { Code = "Invoices.Create", ModuleCode = "invoices", Description = "Create invoices" },
            new BizCore.Domain.Entities.Permission { Code = "Invoices.Edit", ModuleCode = "invoices", Description = "Edit invoices" },
            new BizCore.Domain.Entities.Permission { Code = "Invoices.Delete", ModuleCode = "invoices", Description = "Delete invoices" },
            // Inventory
            new BizCore.Domain.Entities.Permission { Code = "Inventory.View", ModuleCode = "inventory", Description = "View inventory" },
            new BizCore.Domain.Entities.Permission { Code = "Inventory.Edit", ModuleCode = "inventory", Description = "Edit inventory" },
            new BizCore.Domain.Entities.Permission { Code = "Inventory.Delete", ModuleCode = "inventory", Description = "Delete products" },
            // Expenses
            new BizCore.Domain.Entities.Permission { Code = "Expenses.View", ModuleCode = "expenses", Description = "View expenses" },
            new BizCore.Domain.Entities.Permission { Code = "Expenses.Create", ModuleCode = "expenses", Description = "Create expenses" },
            new BizCore.Domain.Entities.Permission { Code = "Expenses.Edit", ModuleCode = "expenses", Description = "Edit expenses" },
            new BizCore.Domain.Entities.Permission { Code = "Expenses.Delete", ModuleCode = "expenses", Description = "Delete expenses" },
            // Reports
            new BizCore.Domain.Entities.Permission { Code = "Reports.View", ModuleCode = "reports", Description = "View reports" },
            // Khata
            new BizCore.Domain.Entities.Permission { Code = "Khata.View", ModuleCode = "khata", Description = "View khata" },
            new BizCore.Domain.Entities.Permission { Code = "Khata.Create", ModuleCode = "khata", Description = "Create khata entries" },
            new BizCore.Domain.Entities.Permission { Code = "Khata.Edit", ModuleCode = "khata", Description = "Edit khata entries" },
            // HR
            new BizCore.Domain.Entities.Permission { Code = "HR.Manage", ModuleCode = "hr", Description = "Manage company HR" },
            new BizCore.Domain.Entities.Permission { Code = "HR.ViewSelf", ModuleCode = "hr", Description = "View own HR data" },
            new BizCore.Domain.Entities.Permission { Code = "HR.View", ModuleCode = "hr", Description = "View HR (Legacy)" },
            // Settings
            new BizCore.Domain.Entities.Permission { Code = "Settings.View", ModuleCode = "settings", Description = "View settings" },
            new BizCore.Domain.Entities.Permission { Code = "Settings.Edit", ModuleCode = "settings", Description = "Edit settings" },
            // Contacts
            new BizCore.Domain.Entities.Permission { Code = "Contacts.View", ModuleCode = "invoices", Description = "View contacts" },
            new BizCore.Domain.Entities.Permission { Code = "Contacts.Create", ModuleCode = "invoices", Description = "Create contacts" },
            new BizCore.Domain.Entities.Permission { Code = "Contacts.Edit", ModuleCode = "invoices", Description = "Edit contacts" },
            // Purchase
            new BizCore.Domain.Entities.Permission { Code = "Purchase.View", ModuleCode = "purchase", Description = "View purchases" },
            new BizCore.Domain.Entities.Permission { Code = "Purchase.Create", ModuleCode = "purchase", Description = "Create purchases" },
            new BizCore.Domain.Entities.Permission { Code = "Purchase.Edit", ModuleCode = "purchase", Description = "Edit purchases" },
            // Projects
            new BizCore.Domain.Entities.Permission { Code = "Projects.View", ModuleCode = "projects", Description = "View projects" },
            new BizCore.Domain.Entities.Permission { Code = "Projects.Create", ModuleCode = "projects", Description = "Create projects" },
            new BizCore.Domain.Entities.Permission { Code = "Projects.Edit", ModuleCode = "projects", Description = "Edit projects" },
            // CashBook / Banking
            new BizCore.Domain.Entities.Permission { Code = "CashBook.View", ModuleCode = "reports", Description = "View cash book" },
            new BizCore.Domain.Entities.Permission { Code = "CashBook.Create", ModuleCode = "reports", Description = "Create cash book entries" },
            // VAT
            new BizCore.Domain.Entities.Permission { Code = "VAT.View", ModuleCode = "reports", Description = "View VAT reports" },
            // Dashboard
            new BizCore.Domain.Entities.Permission { Code = "Dashboard.View", ModuleCode = "dashboard", Description = "View dashboard" },
            // Merchants
            new BizCore.Domain.Entities.Permission { Code = "Merchants.View", ModuleCode = "invoices", Description = "View merchants" },
            new BizCore.Domain.Entities.Permission { Code = "Merchants.Manage", ModuleCode = "invoices", Description = "Manage merchants" },
            // Delivery Partners
            new BizCore.Domain.Entities.Permission { Code = "Delivery.View", ModuleCode = "pos", Description = "View delivery partners" },
            new BizCore.Domain.Entities.Permission { Code = "Delivery.Manage", ModuleCode = "pos", Description = "Manage delivery partners" },
        };

        platformDb.Permissions.AddRange(permissions);
        await platformDb.SaveChangesAsync();
        Console.WriteLine($"[Startup] Seeded {permissions.Length} permissions");

        // Assign role permissions
        var rolePermissions = new List<BizCore.Domain.Entities.RolePermission>();
        var permLookup = permissions.ToDictionary(p => p.Code, p => p.Id);

        // Admin: Full access except critical deletes
        var adminPerms = permissions.Where(p => !p.Code.EndsWith(".Delete") || p.Code == "Expenses.Delete").ToList();
        foreach (var p in adminPerms)
            rolePermissions.Add(new BizCore.Domain.Entities.RolePermission { RoleName = "Admin", PermissionId = p.Id });

        // Accountant
        var accountantCodes = new[] { "Invoices.View", "Expenses.View", "Expenses.Create", "Expenses.Edit", "Expenses.Delete",
            "Reports.View", "Khata.View", "Khata.Create", "Khata.Edit", "CashBook.View", "CashBook.Create", "VAT.View", "Dashboard.View", "POS.View", "HR.ViewSelf" };
        foreach (var code in accountantCodes)
            if (permLookup.ContainsKey(code))
                rolePermissions.Add(new BizCore.Domain.Entities.RolePermission { RoleName = "Accountant", PermissionId = permLookup[code] });

        // Sales
        var salesCodes = new[] { "Invoices.View", "Invoices.Create", "Invoices.Edit", "POS.View", "POS.Create",
            "Contacts.View", "Contacts.Create", "Contacts.Edit", "Dashboard.View", "HR.ViewSelf" };
        foreach (var code in salesCodes)
            if (permLookup.ContainsKey(code))
                rolePermissions.Add(new BizCore.Domain.Entities.RolePermission { RoleName = "Sales", PermissionId = permLookup[code] });

        // POSOperator
        var posCodes = new[] { "POS.View", "POS.Create", "POS.Refund", "Dashboard.View", "HR.ViewSelf" };
        foreach (var code in posCodes)
            if (permLookup.ContainsKey(code))
                rolePermissions.Add(new BizCore.Domain.Entities.RolePermission { RoleName = "POSOperator", PermissionId = permLookup[code] });

        // HRManager
        var hrCodes = new[] { "HR.Manage", "HR.ViewSelf", "Dashboard.View" };
        foreach (var code in hrCodes)
            if (permLookup.ContainsKey(code))
                rolePermissions.Add(new BizCore.Domain.Entities.RolePermission { RoleName = "HRManager", PermissionId = permLookup[code] });

        platformDb.RolePermissions.AddRange(rolePermissions);
        await platformDb.SaveChangesAsync();
        Console.WriteLine($"[Startup] Seeded {rolePermissions.Count} role-permission mappings");
    }
}

app.Run();
