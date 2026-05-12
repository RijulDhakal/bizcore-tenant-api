using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Infrastructure;
using BizCore.Infrastructure.Data;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(AppDbContext))]
    [Migration("20260416120000_AddSubscriptionTables")]
    public partial class AddSubscriptionTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SubscriptionPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    MonthlyPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    AnnualPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    MaxUsers = table.Column<int>(type: "integer", nullable: false),
                    MaxProducts = table.Column<int>(type: "integer", nullable: false),
                    MaxInvoices = table.Column<int>(type: "integer", nullable: false),
                    AllowPOS = table.Column<bool>(type: "boolean", nullable: false),
                    AllowInventory = table.Column<bool>(type: "boolean", nullable: false),
                    AllowInvoices = table.Column<bool>(type: "boolean", nullable: false),
                    AllowPayroll = table.Column<bool>(type: "boolean", nullable: false),
                    AllowProjects = table.Column<bool>(type: "boolean", nullable: false),
                    AllowReports = table.Column<bool>(type: "boolean", nullable: false),
                    AllowMultipleBranches = table.Column<bool>(type: "boolean", nullable: false),
                    AllowAPI = table.Column<bool>(type: "boolean", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    IsDefault = table.Column<bool>(type: "boolean", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    FeaturesJson = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubscriptionPlans", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "BusinessSubscriptions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BusinessId = table.Column<Guid>(type: "uuid", nullable: false),
                    PlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    StartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "text", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    PaymentMethod = table.Column<string>(type: "text", nullable: true),
                    TransactionId = table.Column<string>(type: "text", nullable: true),
                    CancelledAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CancellationReason = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BusinessSubscriptions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BusinessSubscriptions_Businesses_BusinessId",
                        column: x => x.BusinessId,
                        principalTable: "Businesses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_BusinessSubscriptions_SubscriptionPlans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "SubscriptionPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BusinessSubscriptions_BusinessId",
                table: "BusinessSubscriptions",
                column: "BusinessId");

            migrationBuilder.CreateIndex(
                name: "IX_BusinessSubscriptions_PlanId",
                table: "BusinessSubscriptions",
                column: "PlanId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "BusinessSubscriptions");
            migrationBuilder.DropTable(name: "SubscriptionPlans");
        }
    }
}
