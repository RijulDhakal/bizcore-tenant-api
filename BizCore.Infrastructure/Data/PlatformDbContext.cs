using BizCore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Data;

public class PlatformDbContext : DbContext
{
    public PlatformDbContext(DbContextOptions<PlatformDbContext> options)
        : base(options)
    {
    }

    public DbSet<Module> Modules => Set<Module>();
    public DbSet<TenantModule> TenantModules => Set<TenantModule>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<SuperAdminAuditLog> SuperAdminAuditLogs => Set<SuperAdminAuditLog>();
    public DbSet<FeatureFlag> FeatureFlags => Set<FeatureFlag>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Keep PlatformDbContext limited to platform tables only.
        // Avoid accidentally pulling Identity/User entities into this model.
        modelBuilder.Entity<SuperAdminAuditLog>().Ignore(x => x.ActorUser);

        modelBuilder.Entity<Module>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<TenantModule>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<Permission>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<RolePermission>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<SuperAdminAuditLog>().HasQueryFilter(e => !e.IsDeleted);
        modelBuilder.Entity<FeatureFlag>().HasQueryFilter(e => !e.IsDeleted);

        modelBuilder.Entity<Module>().HasIndex(m => m.Code).IsUnique();
        modelBuilder.Entity<TenantModule>().HasIndex(tm => new { tm.TenantId, tm.ModuleId }).IsUnique();
        modelBuilder.Entity<Permission>().HasIndex(p => p.Code).IsUnique();
        modelBuilder.Entity<RolePermission>().HasIndex(rp => new { rp.RoleName, rp.PermissionId }).IsUnique();

        modelBuilder.Entity<TenantModule>()
            .HasOne(tm => tm.Module)
            .WithMany()
            .HasForeignKey(tm => tm.ModuleId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<RolePermission>()
            .HasOne(rp => rp.Permission)
            .WithMany()
            .HasForeignKey(rp => rp.PermissionId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
