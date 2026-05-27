using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagement.api.Migrations
{
    /// <inheritdoc />
    public partial class AddRecoveryEmailToEmployee : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "RecoveryEmail",
                table: "Employees",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecoveryEmail",
                table: "Employees");
        }
    }
}
