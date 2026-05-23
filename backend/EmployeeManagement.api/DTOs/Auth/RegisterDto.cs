namespace EmployeeManagement.api.DTOs.Auth
{
    public class RegisterDto
    {
        public string Username { get; set; } = string.Empty;

        public string Password { get; set; } = string.Empty;

        public int RoleId { get; set; }

        public int EmployeeId { get; set; }
    }
}
