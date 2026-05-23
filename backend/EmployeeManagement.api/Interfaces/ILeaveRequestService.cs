using EmployeeManagement.api.DTOs.LeaveRequest;

namespace EmployeeManagement.api.Interfaces
{
    public interface ILeaveRequestService
    {
        Task<IEnumerable<LeaveRequestDto>>
            GetAllLeaveRequests();

        Task<IEnumerable<LeaveRequestDto>>
            GetEmployeeLeaveRequests(int employeeId);

        Task<LeaveRequestDto>
            CreateLeaveRequest(CreateLeaveRequestDto dto);

        Task<bool> ApproveLeaveRequest(int leaveRequestId);

        Task<bool> RejectLeaveRequest(int leaveRequestId);
    }
}