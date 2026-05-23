using EmployeeManagement.api.DTOs.Attendance;

namespace EmployeeManagement.api.Interfaces
{
    public interface IAttendanceService
    {
        Task<AttendanceDto> CheckIn(int employeeId);

        Task<bool> CheckOut(int employeeId);

        Task<IEnumerable<AttendanceDto>>
            GetEmployeeAttendance(int employeeId);

        Task<IEnumerable<AttendanceDto>>
            GetAllAttendance();
    }
}