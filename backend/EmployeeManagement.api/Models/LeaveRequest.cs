namespace EmployeeManagement.api.Models
{
    public class LeaveRequest
    {
        public int LeaveRequestId { get; set; }

        public int EmployeeId { get; set; }

        public Employee Employee { get; set; } = null!;

        public string LeaveType { get; set; }
            = string.Empty;

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Reason { get; set; }
            = string.Empty;

        public string Status { get; set; }
            = "Pending";

        public DateTime RequestedAt { get; set; }
            = DateTime.Now;
    }
}