namespace EmployeeManagement.api.DTOs.LeaveRequest
{
    public class LeaveRequestDto
    {
        public int LeaveRequestId { get; set; }

        public int EmployeeId { get; set; }

        public string LeaveType { get; set; }
            = string.Empty;

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Reason { get; set; }
            = string.Empty;

        public string Status { get; set; }
            = string.Empty;

        public string EmployeeName { get; set; }
            = string.Empty;

        public int DaysCount { get; set; }
    }
}