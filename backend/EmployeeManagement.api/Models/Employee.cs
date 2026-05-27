using EmployeeManagement.api.Models;

namespace EmployeeManagement.api.Models
{
    public class Employee
    {
        public int EmployeeId { get; set; }

        public string EmployeeCode { get; set; } = string.Empty;

        public string FirstName { get; set; } = string.Empty;

        public string LastName { get; set; } = string.Empty;

        public string Email { get; set; } = string.Empty;

        // Optional separate email for password reset links. Falls back to Email if not set.
        public string? RecoveryEmail { get; set; }

        public string Phone { get; set; } = string.Empty;

        public string Address { get; set; } = string.Empty;

        public DateTime DOB { get; set; }

        public string Gender { get; set; } = string.Empty;

        public DateTime JoiningDate { get; set; }

        public int DepartmentId { get; set; }

        public Department Department { get; set; } = null!;

        public int LevelId { get; set; }

        public EmployeeLevel Level { get; set; } = null!;

        public ICollection<Attendance> Attendances { get; set; }
            = new List<Attendance>();

        public int RemainingLeaveDays { get; set; } = 14;

        public string? ProfileImage { get; set; }

        public string? CvPath { get; set; }

        public ICollection<LeaveRequest> LeaveRequests
        { get; set; } = new List<LeaveRequest>();
    }
}