namespace EmployeeManagement.api.DTOs.Attendance
{
    public class AttendanceDto
    {
        public int AttendanceId { get; set; }

        public DateTime Date { get; set; }

        public DateTime CheckInTime { get; set; }

        public DateTime? CheckOutTime { get; set; }

        public double? WorkingHours { get; set; }

        public int EmployeeId { get; set; }

        public string EmployeeName { get; set; }
            = string.Empty;

        public string Status { get; set; }
            = string.Empty;
    }
}
