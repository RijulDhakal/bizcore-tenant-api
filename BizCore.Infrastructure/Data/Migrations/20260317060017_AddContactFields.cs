using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContactFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Brand",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiryDate",
                table: "Products",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "HSNCode",
                table: "Products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsVatApplicable",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ReorderQuantity",
                table: "Products",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "TrackExpiry",
                table: "Products",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PaymentMode",
                table: "KhataEntries",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ReferenceNumber",
                table: "KhataEntries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RunningBalance",
                table: "KhataEntries",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "TransactionType",
                table: "KhataEntries",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AmountInWords",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BankDetails",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BillTo",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BuyerPAN",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsTaxInvoice",
                table: "Invoices",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "Invoices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TermsAndConditions",
                table: "Invoices",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CitizenshipNumber",
                table: "Employees",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DearnesAllowance",
                table: "Employees",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "HouseRentAllowance",
                table: "Employees",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "IsTDSApplicable",
                table: "Employees",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "MedicalAllowance",
                table: "Employees",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PFDeductionPercent",
                table: "Employees",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "SSFDeductionPercent",
                table: "Employees",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "TransportAllowance",
                table: "Employees",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "BusinessName",
                table: "Contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreditDays",
                table: "Contacts",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "CreditLimit",
                table: "Contacts",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "CustomerGroup",
                table: "Contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LandlinePhone",
                table: "Contacts",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OpeningBalance",
                table: "Contacts",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PANNumber",
                table: "Contacts",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Brand",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ExpiryDate",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "HSNCode",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "IsVatApplicable",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ReorderQuantity",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "TrackExpiry",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "PaymentMode",
                table: "KhataEntries");

            migrationBuilder.DropColumn(
                name: "ReferenceNumber",
                table: "KhataEntries");

            migrationBuilder.DropColumn(
                name: "RunningBalance",
                table: "KhataEntries");

            migrationBuilder.DropColumn(
                name: "TransactionType",
                table: "KhataEntries");

            migrationBuilder.DropColumn(
                name: "AmountInWords",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BankDetails",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BillTo",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "BuyerPAN",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "IsTaxInvoice",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "TermsAndConditions",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CitizenshipNumber",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "DearnesAllowance",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "HouseRentAllowance",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "IsTDSApplicable",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "MedicalAllowance",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "PFDeductionPercent",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "SSFDeductionPercent",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "TransportAllowance",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "BusinessName",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "CreditDays",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "CreditLimit",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "CustomerGroup",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "LandlinePhone",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "OpeningBalance",
                table: "Contacts");

            migrationBuilder.DropColumn(
                name: "PANNumber",
                table: "Contacts");
        }
    }
}
