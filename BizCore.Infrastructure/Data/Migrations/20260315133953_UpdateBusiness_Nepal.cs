using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBusiness_Nepal : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "BusinessType",
                table: "Businesses",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "City",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Currency",
                table: "Businesses",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "District",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Email",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FiscalYearStart",
                table: "Businesses",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsVATRegistered",
                table: "Businesses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PANNumber",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VATNumber",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Website",
                table: "Businesses",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BusinessType",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "City",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Currency",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "District",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Email",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "FiscalYearStart",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "IsVATRegistered",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "PANNumber",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "VATNumber",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Website",
                table: "Businesses");
        }
    }
}
