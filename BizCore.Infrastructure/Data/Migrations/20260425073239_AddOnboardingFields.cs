using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddOnboardingFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AddressLine2",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "AlternatePhone",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountName",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankAccountNumber",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankBranch",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Country",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DateFormat",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DefaultWarehouseName",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "GoogleMapsLink",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IFSCCode",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "IndustryCategory",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoicePrefix",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LegalName",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MSMECategory",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NICCode",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Province",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RegistrationDate",
                table: "Businesses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RegistrationNumber",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TaxpayerType",
                table: "Businesses",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimeZone",
                table: "Businesses",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AddressLine2",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "AlternatePhone",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "BankAccountName",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "BankAccountNumber",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "BankBranch",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Country",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "DateFormat",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "DefaultWarehouseName",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "GoogleMapsLink",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "IFSCCode",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "IndustryCategory",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "InvoicePrefix",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Language",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "LegalName",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "MSMECategory",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "NICCode",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "Province",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "RegistrationDate",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "RegistrationNumber",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "TaxpayerType",
                table: "Businesses");

            migrationBuilder.DropColumn(
                name: "TimeZone",
                table: "Businesses");
        }
    }
}
