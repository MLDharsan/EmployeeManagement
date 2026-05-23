using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagement.api.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidateLeavesToLeavesOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RemainingCasualLeaveDays",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "RemainingSickLeaveDays",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "AllowedCasualLeaveDays",
                table: "EmployeeLevel");

            migrationBuilder.DropColumn(
                name: "AllowedSickLeaveDays",
                table: "EmployeeLevel");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RemainingCasualLeaveDays",
                table: "Employees",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RemainingSickLeaveDays",
                table: "Employees",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AllowedCasualLeaveDays",
                table: "EmployeeLevel",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "AllowedSickLeaveDays",
                table: "EmployeeLevel",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
