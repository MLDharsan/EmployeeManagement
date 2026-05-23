using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagement.api.Migrations
{
    /// <inheritdoc />
    public partial class AddAllowedLeaveDaysToEmployeeLevel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AllowedLeaveDays",
                table: "EmployeeLevel",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AllowedLeaveDays",
                table: "EmployeeLevel");
        }
    }
}
