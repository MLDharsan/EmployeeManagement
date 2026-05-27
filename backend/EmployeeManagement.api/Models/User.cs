namespace EmployeeManagement.api.Models
{
    public class User
    {
        public int UserId { get; set; }

        public string Username { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public int RoleId { get; set; }

        public Role Role { get; set; } = null!;

        public int EmployeeId { get; set; }

        public Employee Employee { get; set; } = null!;

        public DateTime? LastPasswordChangedAt { get; set; }
    }
}