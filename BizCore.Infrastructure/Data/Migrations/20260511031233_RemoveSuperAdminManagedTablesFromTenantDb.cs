using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class RemoveSuperAdminManagedTablesFromTenantDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Legacy billing/subscription tables should not live in tenant DBs.
            // Use IF EXISTS + CASCADE so this migration is resilient across tenants.
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"ClientAddOns\" CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"BusinessSubscriptions\" CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"AddOnFeatures\" CASCADE;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS \"SubscriptionPlans\" CASCADE;");

            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Businesses_BusinessId",
                table: "AspNetUsers");

            migrationBuilder.DropForeignKey(
                name: "FK_UserBusinesses_Businesses_BusinessId",
                table: "UserBusinesses");

            migrationBuilder.DropTable(
                name: "Branches");

            migrationBuilder.DropTable(
                name: "FeatureFlags");

            migrationBuilder.DropTable(
                name: "Businesses");

            migrationBuilder.DropIndex(
                name: "IX_UserBusinesses_BusinessId",
                table: "UserBusinesses");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_BusinessId",
                table: "AspNetUsers");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Businesses",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OwnerId = table.Column<Guid>(type: "uuid", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    AddressLine2 = table.Column<string>(type: "text", nullable: true),
                    AlternatePhone = table.Column<string>(type: "text", nullable: true),
                    BankAccountName = table.Column<string>(type: "text", nullable: true),
                    BankAccountNumber = table.Column<string>(type: "text", nullable: true),
                    BankBranch = table.Column<string>(type: "text", nullable: true),
                    BankName = table.Column<string>(type: "text", nullable: true),
                    BusinessType = table.Column<string>(type: "text", nullable: false),
                    City = table.Column<string>(type: "text", nullable: true),
                    Country = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    DateFormat = table.Column<string>(type: "text", nullable: true),
                    DefaultCurrency = table.Column<string>(type: "text", nullable: false),
                    DefaultWarehouseName = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    District = table.Column<string>(type: "text", nullable: true),
                    Email = table.Column<string>(type: "text", nullable: true),
                    EnableInventory = table.Column<bool>(type: "boolean", nullable: false),
                    FiscalYearStart = table.Column<string>(type: "text", nullable: false),
                    IndustryCategory = table.Column<string>(type: "text", nullable: true),
                    InvoicePrefix = table.Column<string>(type: "text", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsVATRegistered = table.Column<bool>(type: "boolean", nullable: false),
                    Language = table.Column<string>(type: "text", nullable: true),
                    LegalName = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    MSMECategory = table.Column<string>(type: "text", nullable: true),
                    MapsLocation = table.Column<string>(type: "text", nullable: true),
                    NICCode = table.Column<string>(type: "text", nullable: true),
                    Name = table.Column<string>(type: "text", nullable: false),
                    OnboardingStatus = table.Column<string>(type: "jsonb", nullable: false),
                    PANNumber = table.Column<string>(type: "text", nullable: true),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    PostalCode = table.Column<string>(type: "text", nullable: true),
                    Province = table.Column<string>(type: "text", nullable: true),
                    RegistrationDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RegistrationNumber = table.Column<string>(type: "text", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    TaxpayerType = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    TimeZone = table.Column<string>(type: "text", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    VATNumber = table.Column<string>(type: "text", nullable: true),
                    Website = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Businesses", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Businesses_AspNetUsers_OwnerId",
                        column: x => x.OwnerId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FeatureFlags",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    EnabledForRoles = table.Column<string>(type: "text", nullable: true),
                    EnabledUntil = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    FeatureName = table.Column<string>(type: "text", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FeatureFlags", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Branches",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    Address = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    IsMain = table.Column<bool>(type: "boolean", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Phone = table.Column<string>(type: "text", nullable: true),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Branches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Branches_Businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "Businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_UserBusinesses_BusinessId",
                table: "UserBusinesses",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_BusinessId",
                table: "AspNetUsers",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_Branches_BusinessId",
                table: "Branches",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_Businesses_OwnerId",
                table: "Businesses",
                column: "OwnerId");

            migrationBuilder.CreateIndex(
                name: "IX_Businesses_TenantId",
                table: "Businesses",
                column: "TenantId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Businesses_TenantId_IsDeleted_CreatedAt",
                table: "Businesses",
                columns: new[] { "TenantId", "IsDeleted", "CreatedAt" });

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Businesses_BusinessId",
                table: "AspNetUsers",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_UserBusinesses_Businesses_BusinessId",
                table: "UserBusinesses",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
