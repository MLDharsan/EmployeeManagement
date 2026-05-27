using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EmployeeManagement.api.Migrations
{
    /// <inheritdoc />
    public partial class AddSenderNameToNotification : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SenderName",
                table: "Notifications",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SenderName",
                table: "Notifications");
        }
    }
}
