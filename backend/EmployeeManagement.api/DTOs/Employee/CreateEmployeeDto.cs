namespace EmployeeManagement.api.DTOs.Employee
{
    public class CreateEmployeeDto
    {
        public string EmployeeCode { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        // Optional recovery email for password reset links
        public string? RecoveryEmail { get; set; }

        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public DateTime DOB { get; set; }

        public string Gender { get; set; } = string.Empty;

        public DateTime JoiningDate { get; set; }

        public int DepartmentId { get; set; }

        public int LevelId { get; set; }

        public string? Username { get; set; }

        public string? Password { get; set; }
    }
}
