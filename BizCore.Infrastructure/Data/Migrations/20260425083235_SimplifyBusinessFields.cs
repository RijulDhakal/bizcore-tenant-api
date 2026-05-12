using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyBusinessFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IFSCCode",
                table: "Businesses");

            migrationBuilder.AddColumn<bool>(
                name: "EnableInventory",
                table: "Businesses",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EnableInventory",
                table: "Businesses");

            migrationBuilder.AddColumn<string>(
                name: "IFSCCode",
                table: "Businesses",
                type: "text",
                nullable: true);
        }
    }
}
