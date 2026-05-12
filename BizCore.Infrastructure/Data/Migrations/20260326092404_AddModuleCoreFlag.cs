using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BizCore.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddModuleCoreFlag : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCore",
                table: "Modules",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCore",
                table: "Modules");
        }
    }
}
