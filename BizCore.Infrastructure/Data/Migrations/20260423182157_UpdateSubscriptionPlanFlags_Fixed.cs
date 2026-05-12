using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSubscriptionPlanFlags_Fixed : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "Batches");



            migrationBuilder.RenameColumn(
                name: "Amount",
                table: "InvoiceItems",
                newName: "LineTotal");

            migrationBuilder.RenameColumn(
                name: "OpeningBalance",
                table: "Contacts",
                newName: "SupplierCurrentBalance");



            migrationBuilder.RenameColumn(
                name: "CreditLimit",
                table: "Contacts",
                newName: "CustomerCurrentBalance");

            migrationBuilder.RenameColumn(
                name: "CreditDays",
                table: "Contacts",
                newName: "SupplierCreditDays");











            migrationBuilder.AddColumn<int>(
                name: "MaxBranches",
                table: "SubscriptionPlans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxStorageMB",
                table: "SubscriptionPlans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MaxWarehouses",
                table: "SubscriptionPlans",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "SetupFee",
                table: "SubscriptionPlans",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);



            migrationBuilder.AddColumn<Guid>(
                name: "BatchId",
                table: "StockMovements",
                type: "uuid",
                nullable: true);







            migrationBuilder.AddColumn<decimal>(
                name: "DiscountTotal",
                table: "Invoices",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "DiscountType",
                table: "Invoices",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountValue",
                table: "Invoices",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<int>(
                name: "Quantity",
                table: "InvoiceItems",
                type: "integer",
                precision: 18,
                scale: 4,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,4)",
                oldPrecision: 18,
                oldScale: 4);

            migrationBuilder.AddColumn<int>(
                name: "DiscountType",
                table: "InvoiceItems",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "DiscountValue",
                table: "InvoiceItems",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "LineDiscountAmount",
                table: "InvoiceItems",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "LineSubtotal",
                table: "InvoiceItems",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<Guid>(
                name: "ProductId",
                table: "InvoiceItems",
                type: "uuid",
                nullable: true);





            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Expenses",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,4)",
                oldPrecision: 18,
                oldScale: 4);

            migrationBuilder.AddColumn<Guid>(
                name: "BillableToCustomerId",
                table: "Expenses",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "InvoiceId",
                table: "Expenses",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsBillable",
                table: "Expenses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "IsRecurringTemplate",
                table: "Expenses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastGeneratedDate",
                table: "Expenses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextDueDate",
                table: "Expenses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "VendorId",
                table: "Expenses",
                type: "uuid",
                nullable: true);



            migrationBuilder.AddColumn<int>(
                name: "CustomerCreditDays",
                table: "Contacts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "CustomerCreditLimit",
                table: "Contacts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "CustomerOpeningBalance",
                table: "Contacts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "DefaultPaymentTerms",
                table: "Contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SupplierCreditLimit",
                table: "Contacts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SupplierOpeningBalance",
                table: "Contacts",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                defaultValue: 0m);



            migrationBuilder.AddColumn<string>(
                name: "BillingCycle",
                table: "BusinessSubscriptions",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsTrial",
                table: "BusinessSubscriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "TrialEndDate",
                table: "BusinessSubscriptions",
                type: "timestamp with time zone",
                nullable: true);



            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Batches",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "WarehouseId",
                table: "Batches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "LinkedTransactionId",
                table: "BankTransactions",
                type: "uuid",
                nullable: true);



            migrationBuilder.CreateTable(
                name: "ExpenseAttachments",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ExpenseId = table.Column<Guid>(type: "uuid", nullable: false),
                    FileName = table.Column<string>(type: "text", nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    ContentType = table.Column<string>(type: "text", nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExpenseAttachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ExpenseAttachments_Expenses_ExpenseId",
                        column: x => x.ExpenseId,
                        principalTable: "Expenses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PasswordResetTokens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    TokenHash = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PasswordResetTokens", x => x.Id);
                });





            migrationBuilder.CreateTable(
                name: "SupplierProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    ContactId = table.Column<Guid>(type: "uuid", nullable: false),
                    SupplierCode = table.Column<string>(type: "text", nullable: true),
                    VATCategory = table.Column<int>(type: "integer", nullable: false),
                    TDSApplicable = table.Column<bool>(type: "boolean", nullable: false),
                    TDSRate = table.Column<decimal>(type: "numeric(18,4)", precision: 18, scale: 4, nullable: false),
                    PreferredPaymentMethod = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SupplierProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SupplierProfiles_Contacts_ContactId",
                        column: x => x.ContactId,
                        principalTable: "Contacts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserInvites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Email = table.Column<string>(type: "text", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    TokenHash = table.Column<string>(type: "text", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UsedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserInvites", x => x.Id);
                });





            migrationBuilder.CreateIndex(
                name: "IX_ExpenseAttachments_ExpenseId",
                table: "ExpenseAttachments",
                column: "ExpenseId");

            migrationBuilder.CreateIndex(
                name: "IX_ExpenseAttachments_TenantId_ExpenseId",
                table: "ExpenseAttachments",
                columns: new[] { "TenantId", "ExpenseId" });

            migrationBuilder.CreateIndex(
                name: "IX_PasswordResetTokens_UserId_TokenHash",
                table: "PasswordResetTokens",
                columns: new[] { "UserId", "TokenHash" },
                unique: true);



            migrationBuilder.CreateIndex(
                name: "IX_SupplierProfiles_ContactId",
                table: "SupplierProfiles",
                column: "ContactId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserInvites_TenantId_Email_IsDeleted",
                table: "UserInvites",
                columns: new[] { "TenantId", "Email", "IsDeleted" });

            migrationBuilder.CreateIndex(
                name: "IX_UserInvites_TenantId_TokenHash",
                table: "UserInvites",
                columns: new[] { "TenantId", "TokenHash" },
                unique: true);


        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {




            migrationBuilder.DropTable(
                name: "ExpenseAttachments");

            migrationBuilder.DropTable(
                name: "PasswordResetTokens");



            migrationBuilder.DropTable(
                name: "SupplierProfiles");

            migrationBuilder.DropTable(
                name: "UserInvites");





            migrationBuilder.DropColumn(
                name: "MaxBranches",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "MaxStorageMB",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "MaxWarehouses",
                table: "SubscriptionPlans");

            migrationBuilder.DropColumn(
                name: "SetupFee",
                table: "SubscriptionPlans");



            migrationBuilder.DropColumn(
                name: "BatchId",
                table: "StockMovements");







            migrationBuilder.DropColumn(
                name: "DiscountTotal",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DiscountType",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DiscountValue",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "DiscountType",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "DiscountValue",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "LineDiscountAmount",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "LineSubtotal",
                table: "InvoiceItems");

            migrationBuilder.DropColumn(
                name: "ProductId",
                table: "InvoiceItems");





            migrationBuilder.DropColumn(
                name: "BillableToCustomerId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "InvoiceId",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "IsBillable",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "IsRecurringTemplate",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "LastGeneratedDate",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "NextDueDate",
                table: "Expenses");

            migrationBuilder.DropColumn(
                name: "VendorId",
                table: "Expenses");



            migrationBuilder.DropColumn(
                name: "CustomerCreditDays",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "CustomerCreditLimit",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "CustomerOpeningBalance",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "DefaultPaymentTerms",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "SupplierCreditLimit",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "SupplierOpeningBalance",
                table: "Contacts");



            migrationBuilder.DropColumn(
                name: "BillingCycle",
                table: "BusinessSubscriptions");

            migrationBuilder.DropColumn(
                name: "IsTrial",
                table: "BusinessSubscriptions");

            migrationBuilder.DropColumn(
                name: "TrialEndDate",
                table: "BusinessSubscriptions");



            migrationBuilder.DropColumn(
                name: "Status",
                table: "Batches");

            migrationBuilder.DropColumn(
                name: "WarehouseId",
                table: "Batches");

            migrationBuilder.DropColumn(
                name: "LinkedTransactionId",
                table: "BankTransactions");



            migrationBuilder.RenameColumn(
                name: "LineTotal",
                table: "InvoiceItems",
                newName: "Amount");



            migrationBuilder.RenameColumn(
                name: "SupplierCurrentBalance",
                table: "Contacts",
                newName: "OpeningBalance");

            migrationBuilder.RenameColumn(
                name: "SupplierCreditDays",
                table: "Contacts",
                newName: "CreditDays");

            migrationBuilder.RenameColumn(
                name: "CustomerCurrentBalance",
                table: "Contacts",
                newName: "CreditLimit");

            migrationBuilder.AlterColumn<decimal>(
                name: "Quantity",
                table: "InvoiceItems",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldPrecision: 18,
                oldScale: 4);

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "Expenses",
                type: "numeric(18,4)",
                precision: 18,
                scale: 4,
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "Batches",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }
    }
}
