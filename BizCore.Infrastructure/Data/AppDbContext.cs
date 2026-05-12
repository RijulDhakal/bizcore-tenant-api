using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using BizCore.Domain.Entities;
using BizCore.Application.Interfaces;

namespace BizCore.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<ApplicationUser, Microsoft.AspNetCore.Identity.IdentityRole<Guid>, Guid>
{
    private readonly ITenantService _tenantService;

    public AppDbContext(DbContextOptions<AppDbContext> options, ITenantService tenantService)
        : base(options)
    {
        _tenantService = tenantService;
    }

    public DbSet<UserBusiness> UserBusinesses => Set<UserBusiness>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Party> Parties => Set<Party>();
    public DbSet<KhataEntry> KhataEntries => Set<KhataEntry>();
    public DbSet<KhataReminder> KhataReminders => Set<KhataReminder>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<SupplierProfile> SupplierProfiles => Set<SupplierProfile>();
    public DbSet<ContactKhataLink> ContactKhataLinks => Set<ContactKhataLink>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();

    // Phase 2 Sets
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<WarehouseStock> WarehouseStocks => Set<WarehouseStock>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Batch> Batches => Set<Batch>();
    public DbSet<StockTransfer> StockTransfers => Set<StockTransfer>();
    public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
    public DbSet<PurchaseOrderItem> PurchaseOrderItems => Set<PurchaseOrderItem>();
    public DbSet<GoodsReceipt> GoodsReceipts => Set<GoodsReceipt>();
    public DbSet<GoodsReceiptItem> GoodsReceiptItems => Set<GoodsReceiptItem>();
    public DbSet<PurchaseReturn> PurchaseReturns => Set<PurchaseReturn>();
    public DbSet<PurchaseReturnItem> PurchaseReturnItems => Set<PurchaseReturnItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<POSSession> POSSessions => Set<POSSession>();
    public DbSet<POSTransaction> POSTransactions => Set<POSTransaction>();
    public DbSet<POSTransactionItem> POSTransactionItems => Set<POSTransactionItem>();
    
    // Phase 3 Sets
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Attendance> Attendances => Set<Attendance>();
    public DbSet<LeaveRequest> LeaveRequests => Set<LeaveRequest>();
    public DbSet<Payroll> Payrolls => Set<Payroll>();
    public DbSet<HRAssistanceRequest> HRAssistanceRequests => Set<HRAssistanceRequest>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<ProjectTask> ProjectTasks => Set<ProjectTask>();
    public DbSet<Timesheet> Timesheets => Set<Timesheet>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ExpenseAttachment> ExpenseAttachments => Set<ExpenseAttachment>();
    public DbSet<ExpenseCategory> ExpenseCategories => Set<ExpenseCategory>();
    public DbSet<BankAccount> BankAccounts => Set<BankAccount>();
    public DbSet<BankTransaction> BankTransactions => Set<BankTransaction>();
    public DbSet<AccountTransfer> AccountTransfers => Set<AccountTransfer>();
    public DbSet<UserLoginHistory> UserLoginHistories => Set<UserLoginHistory>();
    public DbSet<DamagedGoods> DamagedGoods => Set<DamagedGoods>();
    public DbSet<Merchant> Merchants => Set<Merchant>();
    public DbSet<DeliveryPartner> DeliveryPartners => Set<DeliveryPartner>();

    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<LeaveTypeConfig> LeaveTypes => Set<LeaveTypeConfig>();
    public DbSet<LeaveBalance> LeaveBalances => Set<LeaveBalance>();
    public DbSet<CreditNote> CreditNotes => Set<CreditNote>();

    // User provisioning tokens
    public DbSet<UserInvite> UserInvites => Set<UserInvite>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Soft delete + tenant filters for TenantEntity
        builder.Entity<Party>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<KhataEntry>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<KhataReminder>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Contact>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Invoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        
        // Phase 2 Filters
        builder.Entity<Category>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Product>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Warehouse>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<WarehouseStock>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<StockMovement>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Batch>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<StockTransfer>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<PurchaseOrder>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<GoodsReceipt>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<GoodsReceiptItem>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<PurchaseReturn>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<PurchaseReturnItem>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<Payment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<POSSession>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<POSTransaction>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        
        // Phase 3 Filters
        builder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Attendance>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<LeaveRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Payroll>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<HRAssistanceRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Project>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<ProjectTask>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Timesheet>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Expense>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<ExpenseAttachment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<ExpenseCategory>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<BankAccount>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<BankTransaction>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<AccountTransfer>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<DamagedGoods>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<Merchant>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<DeliveryPartner>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());

        builder.Entity<Unit>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<LeaveTypeConfig>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<LeaveBalance>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());
        builder.Entity<CreditNote>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());

        // Soft delete for non-tenant entities
        builder.Entity<RefreshToken>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<UserBusiness>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<InvoiceItem>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<PurchaseOrderItem>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<POSTransactionItem>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<ApplicationUser>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<UserLoginHistory>().HasQueryFilter(e => !e.IsDeleted);

        // Business metadata lives in platform DB; keep tenant Identity isolated from it.
        builder.Entity<ApplicationUser>().Ignore(u => u.Business);
        builder.Entity<UserBusiness>().Ignore(ub => ub.Business);

        // User provisioning tokens
        builder.Entity<UserInvite>().HasQueryFilter(e => !e.IsDeleted);
        builder.Entity<PasswordResetToken>().HasQueryFilter(e => !e.IsDeleted);

        // Configure decimal precision
        builder.Entity<KhataEntry>().Property(e => e.Amount).HasPrecision(18, 4);
        builder.Entity<Party>().Property(e => e.OpeningBalance).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.SubTotal).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.TaxAmount).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.TotalAmount).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.CommissionRate).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.CommissionAmount).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.NetPayable).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.DeliveryFee).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.DiscountTotal).HasPrecision(18, 4);
        builder.Entity<Invoice>().Property(e => e.DiscountValue).HasPrecision(18, 4);

        builder.Entity<Contact>().Property(e => e.CustomerCreditLimit).HasPrecision(18, 4);
        builder.Entity<Contact>().Property(e => e.CustomerOpeningBalance).HasPrecision(18, 4);
        builder.Entity<Contact>().Property(e => e.SupplierCreditLimit).HasPrecision(18, 4);
        builder.Entity<Contact>().Property(e => e.SupplierOpeningBalance).HasPrecision(18, 4);
        builder.Entity<SupplierProfile>().Property(e => e.TDSRate).HasPrecision(18, 4);

        builder.Entity<InvoiceItem>().Property(e => e.Quantity).HasPrecision(18, 4);
        builder.Entity<InvoiceItem>().Property(e => e.UnitPrice).HasPrecision(18, 4);
        builder.Entity<InvoiceItem>().Property(e => e.DiscountValue).HasPrecision(18, 4);
        builder.Entity<InvoiceItem>().Property(e => e.LineSubtotal).HasPrecision(18, 4);
        builder.Entity<InvoiceItem>().Property(e => e.LineDiscountAmount).HasPrecision(18, 4);
        builder.Entity<InvoiceItem>().Property(e => e.LineTotal).HasPrecision(18, 4);

        // Phase 2 Precision
        builder.Entity<Product>().Property(e => e.CostPrice).HasPrecision(18, 4);
        builder.Entity<Product>().Property(e => e.SellingPrice).HasPrecision(18, 4);
        builder.Entity<PurchaseOrder>().Property(e => e.SubTotal).HasPrecision(18, 4);
        builder.Entity<PurchaseOrder>().Property(e => e.TaxAmount).HasPrecision(18, 4);
        builder.Entity<PurchaseOrder>().Property(e => e.TotalAmount).HasPrecision(18, 4);
        builder.Entity<PurchaseOrderItem>().Property(e => e.UnitPrice).HasPrecision(18, 4);
        builder.Entity<PurchaseOrderItem>().Property(e => e.Amount).HasPrecision(18, 4);
        builder.Entity<POSSession>().Property(e => e.OpeningCash).HasPrecision(18, 4);
        builder.Entity<POSSession>().Property(e => e.ClosingCash).HasPrecision(18, 4);
        builder.Entity<POSSession>().Property(e => e.TotalSales).HasPrecision(18, 4);
        builder.Entity<POSTransaction>().Property(e => e.SubTotal).HasPrecision(18, 4);
        builder.Entity<POSTransaction>().Property(e => e.DiscountAmount).HasPrecision(18, 4);
        builder.Entity<POSTransaction>().Property(e => e.TaxAmount).HasPrecision(18, 4);
        builder.Entity<POSTransaction>().Property(e => e.TotalAmount).HasPrecision(18, 4);
        builder.Entity<POSTransaction>().Property(e => e.AmountPaid).HasPrecision(18, 4);
        builder.Entity<POSTransaction>().Property(e => e.Change).HasPrecision(18, 4);
        builder.Entity<POSTransactionItem>().Property(e => e.UnitPrice).HasPrecision(18, 4);
        builder.Entity<POSTransactionItem>().Property(e => e.DiscountPercent).HasPrecision(18, 4);
        builder.Entity<POSTransactionItem>().Property(e => e.Amount).HasPrecision(18, 4);
        
        // Phase 3 Precision
        builder.Entity<Employee>().Property(e => e.BasicSalary).HasPrecision(18, 4);
        builder.Entity<Attendance>().Property(e => e.WorkingHours).HasPrecision(18, 2);
        builder.Entity<Payroll>().Property(e => e.BasicSalary).HasPrecision(18, 4);
        builder.Entity<Payroll>().Property(e => e.Allowances).HasPrecision(18, 4);
        builder.Entity<Payroll>().Property(e => e.Deductions).HasPrecision(18, 4);
        builder.Entity<Payroll>().Property(e => e.NetSalary).HasPrecision(18, 4);
        builder.Entity<Project>().Property(e => e.Budget).HasPrecision(18, 4);
        builder.Entity<ProjectTask>().Property(e => e.EstimatedHours).HasPrecision(18, 2);
        builder.Entity<ProjectTask>().Property(e => e.ActualHours).HasPrecision(18, 2);
        builder.Entity<Timesheet>().Property(e => e.HoursLogged).HasPrecision(18, 2);
        builder.Entity<ExpenseAttachment>()
            .HasOne(ea => ea.Expense)
            .WithMany()
            .HasForeignKey(ea => ea.ExpenseId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ExpenseAttachment>().HasIndex(ea => new { ea.TenantId, ea.ExpenseId });
        builder.Entity<BankAccount>().Property(e => e.OpeningBalance).HasPrecision(18, 4);
        builder.Entity<BankAccount>().Property(e => e.CurrentBalance).HasPrecision(18, 4);
        builder.Entity<BankTransaction>().Property(e => e.Amount).HasPrecision(18, 4);
        builder.Entity<BankTransaction>().Property(e => e.BalanceAfter).HasPrecision(18, 4);
        builder.Entity<DamagedGoods>().Property(e => e.EstimatedLoss).HasPrecision(18, 4);
        builder.Entity<Merchant>().Property(e => e.DefaultCommissionRate).HasPrecision(18, 4);
        builder.Entity<DeliveryPartner>().Property(e => e.DefaultDeliveryFee).HasPrecision(18, 4);

        builder.Entity<Unit>().Property(e => e.ConversionFactor).HasPrecision(18, 4);
        builder.Entity<AccountTransfer>().Property(e => e.Amount).HasPrecision(18, 4);
        builder.Entity<LeaveBalance>().Property(e => e.TotalDays).HasPrecision(18, 2);
        builder.Entity<LeaveBalance>().Property(e => e.UsedDays).HasPrecision(18, 2);
        builder.Entity<LeaveBalance>().Property(e => e.PendingDays).HasPrecision(18, 2);
        builder.Entity<LeaveBalance>().Property(e => e.CarriedForward).HasPrecision(18, 2);
        builder.Entity<CreditNote>().Property(e => e.Amount).HasPrecision(18, 4);
        builder.Entity<CreditNote>().Property(e => e.TaxAmount).HasPrecision(18, 4);
        builder.Entity<CreditNote>().Property(e => e.TotalAmount).HasPrecision(18, 4);

        // Relationships
        builder.Entity<BankTransaction>()
            .HasOne(t => t.Account)
            .WithMany()
            .HasForeignKey(t => t.AccountId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserBusiness>()
            .HasOne(ub => ub.User)
            .WithMany(u => u.UserBusinesses)
            .HasForeignKey(ub => ub.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RefreshToken>()
            .HasOne(rt => rt.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(rt => rt.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<UserLoginHistory>()
            .HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<KhataEntry>()
            .HasOne(k => k.Party)
            .WithMany(p => p.Entries)
            .HasForeignKey(k => k.PartyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<KhataReminder>()
            .HasOne(r => r.Party)
            .WithMany()
            .HasForeignKey(r => r.PartyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Invoice>()
            .HasOne(i => i.Customer)
            .WithMany()
            .HasForeignKey(i => i.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<InvoiceItem>()
            .HasOne(ii => ii.Invoice)
            .WithMany(i => i.Items)
            .HasForeignKey(ii => ii.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Inventory Relationships
        builder.Entity<Product>()
            .HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<Category>()
            .HasOne(c => c.ParentCategory)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(c => c.ParentCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StockMovement>(entity =>
        {
            entity.ToTable("StockMovements");
            entity.HasKey(e => e.Id);
            
            entity.HasOne(sm => sm.Product)
                .WithMany(p => p.StockMovements)
                .HasForeignKey(sm => sm.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(sm => sm.Warehouse)
                .WithMany(w => w.StockMovements)
                .HasForeignKey(sm => sm.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<DamagedGoods>()
            .HasOne(d => d.Product)
            .WithMany()
            .HasForeignKey(d => d.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<DamagedGoods>()
            .HasOne(d => d.Warehouse)
            .WithMany()
            .HasForeignKey(d => d.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        // Purchase Relationships
        builder.Entity<PurchaseOrder>()
            .HasOne(po => po.Supplier)
            .WithMany()
            .HasForeignKey(po => po.SupplierId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PurchaseOrderItem>()
            .HasOne(poi => poi.PurchaseOrder)
            .WithMany(po => po.Items)
            .HasForeignKey(poi => poi.PurchaseOrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<PurchaseOrderItem>()
            .HasOne(poi => poi.Product)
            .WithMany()
            .HasForeignKey(poi => poi.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // POS Relationships
        builder.Entity<POSSession>()
            .HasOne(s => s.Warehouse)
            .WithMany()
            .HasForeignKey(s => s.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<POSTransaction>()
            .HasOne(t => t.Session)
            .WithMany()
            .HasForeignKey(t => t.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<POSTransaction>()
            .HasOne(t => t.Customer)
            .WithMany()
            .HasForeignKey(t => t.CustomerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<POSTransactionItem>()
            .HasOne(ti => ti.Transaction)
            .WithMany(t => t.Items)
            .HasForeignKey(ti => ti.TransactionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<POSTransactionItem>()
            .HasOne(ti => ti.Product)
            .WithMany()
            .HasForeignKey(ti => ti.ProductId)
            .OnDelete(DeleteBehavior.Restrict);

        // Indexes
        builder.Entity<ApplicationUser>().HasIndex(u => new { u.Id, u.IsDeleted });
        builder.Entity<Party>().HasIndex(p => new { p.TenantId, p.IsDeleted, p.Name });
        builder.Entity<KhataEntry>().HasIndex(k => new { k.TenantId, k.PartyId, k.IsDeleted, k.Date, k.CreatedAt });
        builder.Entity<KhataEntry>().HasIndex(k => new { k.TenantId, k.PartyId, k.Type, k.Amount, k.CreatedAt });
        builder.Entity<Invoice>().HasIndex(i => new { i.TenantId, i.InvoiceNumber }).IsUnique();
        builder.Entity<Product>().HasIndex(p => new { p.TenantId, p.SKU }).IsUnique();
        builder.Entity<WarehouseStock>(entity =>
        {
            entity.ToTable("WarehouseStocks");
            entity.HasKey(e => e.Id);

            entity.HasIndex(e => new { e.WarehouseId, e.ProductId, e.BatchId })
                .IsUnique()
                .HasFilter("\"IsDeleted\" = false");

            entity.HasOne(ws => ws.Product)
                .WithMany(p => p.WarehouseStocks)
                .HasForeignKey(ws => ws.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ws => ws.Warehouse)
                .WithMany(w => w.WarehouseStocks)
                .HasForeignKey(ws => ws.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ws => ws.Batch)
                .WithMany()
                .HasForeignKey(ws => ws.BatchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Batch Relationships
        builder.Entity<Batch>()
            .HasOne(b => b.Product)
            .WithMany(p => p.Batches)
            .HasForeignKey(b => b.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<PurchaseOrder>().HasIndex(po => new { po.TenantId, po.PONumber }).IsUnique();
        builder.Entity<POSTransaction>().HasIndex(t => new { t.TenantId, t.TransactionNumber }).IsUnique();

        builder.Entity<UserInvite>().HasIndex(i => new { i.TenantId, i.Email, i.IsDeleted });
        builder.Entity<UserInvite>().HasIndex(i => new { i.TenantId, i.TokenHash }).IsUnique();

        builder.Entity<PasswordResetToken>().HasIndex(t => new { t.UserId, t.TokenHash }).IsUnique();
        
        // Phase 3 Relationships & Indexes
        builder.Entity<Employee>().HasIndex(e => new { e.TenantId, e.EmployeeCode }).IsUnique();
        builder.Entity<Payroll>().HasIndex(p => new { p.TenantId, p.EmployeeId, p.Month, p.Year }).IsUnique();

        builder.Entity<Attendance>()
            .HasOne(a => a.Employee)
            .WithMany(e => e.Attendances)
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<LeaveRequest>()
            .HasOne(l => l.Employee)
            .WithMany(e => e.LeaveRequests)
            .HasForeignKey(l => l.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Payroll>()
            .HasOne(p => p.Employee)
            .WithMany(e => e.Payrolls)
            .HasForeignKey(p => p.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<HRAssistanceRequest>()
            .HasOne(a => a.Employee)
            .WithMany()
            .HasForeignKey(a => a.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Project>()
            .HasOne(p => p.Client)
            .WithMany()
            .HasForeignKey(p => p.ClientId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Project>()
            .HasOne(p => p.Manager)
            .WithMany()
            .HasForeignKey(p => p.ManagerId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<ProjectTask>()
            .HasOne(pt => pt.Project)
            .WithMany(p => p.Tasks)
            .HasForeignKey(pt => pt.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<ProjectTask>()
            .HasOne(pt => pt.Assignee)
            .WithMany()
            .HasForeignKey(pt => pt.AssigneeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Timesheet>()
            .HasOne(t => t.Employee)
            .WithMany()
            .HasForeignKey(t => t.EmployeeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Timesheet>()
            .HasOne(t => t.Project)
            .WithMany(p => p.Timesheets)
            .HasForeignKey(t => t.ProjectId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<Timesheet>()
            .HasOne(t => t.Task)
            .WithMany()
            .HasForeignKey(t => t.TaskId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Entity<SupplierProfile>()
            .HasOne(s => s.Contact)
            .WithMany()
            .HasForeignKey(s => s.ContactId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<SupplierProfile>().HasIndex(s => s.ContactId).IsUnique();
        builder.Entity<SupplierProfile>().HasQueryFilter(e => !e.IsDeleted);

        builder.Entity<ContactKhataLink>()
            .HasOne(l => l.Contact)
            .WithMany()
            .HasForeignKey(l => l.ContactId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ContactKhataLink>()
            .HasOne(l => l.KhataAccount)
            .WithMany()
            .HasForeignKey(l => l.KhataAccountId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.Entity<ContactKhataLink>().HasIndex(l => new { l.TenantId, l.ContactId }).IsUnique();
        builder.Entity<ContactKhataLink>().HasIndex(l => new { l.TenantId, l.KhataAccountId }).IsUnique();
        builder.Entity<ContactKhataLink>().HasQueryFilter(e => !e.IsDeleted);

        // --- Missing tables: configuration ---

        // Unit configuration
        builder.Entity<Unit>(entity =>
        {
            entity.HasOne(x => x.BaseUnit)
                .WithMany()
                .HasForeignKey(x => x.BaseUnitId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ExpenseCategory hierarchical configuration
        builder.Entity<ExpenseCategory>(entity =>
        {
            entity.HasOne(x => x.Parent)
                .WithMany(x => x.Children)
                .HasForeignKey(x => x.ParentId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(x => x.Path);
        });

        // Leave types (entity name avoids conflict with LeaveType enum)
        builder.Entity<LeaveTypeConfig>().ToTable("LeaveTypes");

        // LeaveBalance unique constraint + relationships
        builder.Entity<LeaveBalance>(entity =>
        {
            entity.HasIndex(x => new { x.EmployeeId, x.LeaveTypeId, x.Year }).IsUnique();

            entity.HasOne(x => x.Employee)
                .WithMany()
                .HasForeignKey(x => x.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.LeaveType)
                .WithMany()
                .HasForeignKey(x => x.LeaveTypeId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // AccountTransfer configuration
        builder.Entity<AccountTransfer>(entity =>
        {
            entity.HasIndex(x => x.FromAccountId);
            entity.HasIndex(x => x.ToAccountId);
            entity.HasIndex(x => x.TransferDate);
            entity.HasIndex(x => x.Status);

            entity.HasOne(x => x.FromAccount)
                .WithMany()
                .HasForeignKey(x => x.FromAccountId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(x => x.ToAccount)
                .WithMany()
                .HasForeignKey(x => x.ToAccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // CreditNote configuration
        builder.Entity<CreditNote>(entity =>
        {
            entity.HasIndex(x => x.CreditNoteNumber).IsUnique();
            entity.HasIndex(x => x.InvoiceId);
            entity.HasIndex(x => x.Status);

            entity.HasOne(x => x.Invoice)
                .WithMany()
                .HasForeignKey(x => x.InvoiceId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // --- Global DateTime Converter for PostgreSQL ---
        var dateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime, DateTime>(
            v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
            v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc));

        var nullableDateTimeConverter = new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
            v => !v.HasValue ? v : (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)),
            v => !v.HasValue ? v : (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)));

        foreach (var entityType in builder.Model.GetEntityTypes())
        {
            if (entityType.IsKeyless) continue;

            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                {
                    property.SetValueConverter(dateTimeConverter);
                }
                else if (property.ClrType == typeof(DateTime?))
                {
                    property.SetValueConverter(nullableDateTimeDateTimeConverter());
                }
            }
        }
    }

    private static Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?> nullableDateTimeDateTimeConverter()
    {
        return new Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter<DateTime?, DateTime?>(
            v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) : v,
            v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) : v);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is BaseEntity baseEntity)
            {
                baseEntity.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    baseEntity.CreatedAt = DateTime.UtcNow;
            }

            if (entry.Entity is ApplicationUser user && entry.State == EntityState.Modified)
                user.UpdatedAt = DateTime.UtcNow;
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
