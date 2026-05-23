using EmployeeManagement.api.Data;
using EmployeeManagement.api.DTOs.Attendance;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.api.Services
{
    public class AttendanceService : IAttendanceService
    {
        private readonly AppDbContext _context;

        public AttendanceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<AttendanceDto>> GetAllAttendance()
        {
            return await _context.Attendances
                .Include(a => a.Employee)
                .Select(a => new AttendanceDto
                {
                    AttendanceId = a.AttendanceId,
                    Date = a.AttendanceDate,
                    CheckInTime = a.ClockInTime,
                    CheckOutTime = a.ClockOutTime,
                    WorkingHours = a.WorkingHours,
                    EmployeeId = a.EmployeeId,
                    EmployeeName = a.Employee != null ? $"{a.Employee.FirstName} {a.Employee.LastName}" : "",
                    Status = a.Status
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<AttendanceDto>> GetEmployeeAttendance(int employeeId)
        {
            return await _context.Attendances
                .Include(a => a.Employee)
                .Where(a => a.EmployeeId == employeeId)
                .Select(a => new AttendanceDto
                {
                    AttendanceId = a.AttendanceId,
                    Date = a.AttendanceDate,
                    CheckInTime = a.ClockInTime,
                    CheckOutTime = a.ClockOutTime,
                    WorkingHours = a.WorkingHours,
                    EmployeeId = a.EmployeeId,
                    EmployeeName = a.Employee != null ? $"{a.Employee.FirstName} {a.Employee.LastName}" : "",
                    Status = a.Status
                })
                .ToListAsync();
        }

        public async Task<AttendanceDto> CheckIn(int employeeId)
        {
            var today = DateTime.Today;
            
            // Check if already checked in today
            var existing = await _context.Attendances
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.AttendanceDate == today);

            if (existing != null)
            {
                var emp = await _context.Employees.FindAsync(employeeId);
                return new AttendanceDto
                {
                    AttendanceId = existing.AttendanceId,
                    Date = existing.AttendanceDate,
                    CheckInTime = existing.ClockInTime,
                    CheckOutTime = existing.ClockOutTime,
                    WorkingHours = existing.WorkingHours,
                    EmployeeId = existing.EmployeeId,
                    EmployeeName = emp != null ? $"{emp.FirstName} {emp.LastName}" : "",
                    Status = existing.Status
                };
            }

            var now = DateTime.Now;
            bool isLate = now.Hour > 9 || (now.Hour == 9 && now.Minute > 0);

            var attendance = new Attendance
            {
                EmployeeId = employeeId,
                AttendanceDate = today,
                ClockInTime = now,
                ClockOutTime = null,
                Status = isLate ? "Late" : "Present",
                WorkingHours = null
            };

            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();

            var employee = await _context.Employees.FindAsync(employeeId);

            return new AttendanceDto
            {
                AttendanceId = attendance.AttendanceId,
                Date = attendance.AttendanceDate,
                CheckInTime = attendance.ClockInTime,
                CheckOutTime = attendance.ClockOutTime,
                WorkingHours = attendance.WorkingHours,
                EmployeeId = attendance.EmployeeId,
                EmployeeName = employee != null ? $"{employee.FirstName} {employee.LastName}" : "",
                Status = attendance.Status
            };
        }

        public async Task<bool> CheckOut(int employeeId)
        {
            var today = DateTime.Today;
            var attendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.EmployeeId == employeeId && a.AttendanceDate == today);

            if (attendance == null || attendance.ClockOutTime != null)
                return false;

            var now = DateTime.Now;
            attendance.ClockOutTime = now;

            // Calculate hours worked
            var diff = now - attendance.ClockInTime;
            attendance.WorkingHours = Math.Round(diff.TotalHours, 2);

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
