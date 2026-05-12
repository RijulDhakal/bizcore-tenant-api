using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddMissingAdminColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add Status column to Businesses
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Businesses",
                type: "text",
                nullable: false,
                defaultValue: "ACTIVE");

            // Add BusinessId column to AspNetUsers
            migrationBuilder.AddColumn<Guid>(
                name: "BusinessId",
                table: "AspNetUsers",
                type: "uuid",
                nullable: true);

            // Add IsActive column to AspNetUsers (default true for existing users)
            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "AspNetUsers",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            // Create index on BusinessId
            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_BusinessId",
                table: "AspNetUsers",
                column: "BusinessId");

            // Add foreign key
            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Businesses_BusinessId",
                table: "AspNetUsers",
                column: "BusinessId",
                principalTable: "Businesses",
                principalColumn: "Id");

            // Backfill: link existing users to their businesses via TenantId
            migrationBuilder.Sql(@"
                UPDATE ""AspNetUsers"" u
                SET ""BusinessId"" = b.""Id""
                FROM ""Businesses"" b
                WHERE u.""CurrentTenantId"" = b.""TenantId""
                AND u.""BusinessId"" IS NULL;
            ");

            // Backfill: set Status = 'ACTIVE' for all existing businesses
            migrationBuilder.Sql(@"
                UPDATE ""Businesses"" SET ""Status"" = 'ACTIVE' WHERE ""Status"" = '' OR ""Status"" IS NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Businesses_BusinessId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_BusinessId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "BusinessId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "AspNetUsers");
        }
    }
}
