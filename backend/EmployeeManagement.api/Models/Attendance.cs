namespace EmployeeManagement.api.Models
{
    public class Attendance
    {
        public int AttendanceId { get; set; }

        public int EmployeeId { get; set; }

        public Employee Employee { get; set; } = null!;

        public DateTime AttendanceDate { get; set; }

        public DateTime ClockInTime { get; set; }

        public DateTime? ClockOutTime { get; set; }

        public string Status { get; set; } = string.Empty;

        public double? WorkingHours { get; set; }
    }
}