namespace EmployeeManagement.api.DTOs.LeaveRequest
{
    public class CreateLeaveRequestDto
    {
        public int EmployeeId { get; set; }

        public string LeaveType { get; set; }
            = string.Empty;

        public DateTime StartDate { get; set; }

        public DateTime EndDate { get; set; }

        public string Reason { get; set; }
            = string.Empty;
    }
}