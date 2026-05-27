using EmployeeManagement.api.Data;
using EmployeeManagement.api.DTOs.LeaveRequest;
using EmployeeManagement.api.DTOs.Notification;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.api.Services
{
    public class LeaveRequestService : ILeaveRequestService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public LeaveRequestService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<LeaveRequestDto>>
            GetAllLeaveRequests()
        {
            return await _context.LeaveRequests
                .Include(l => l.Employee)
                .Select(l => new LeaveRequestDto
                {
                    LeaveRequestId = l.LeaveRequestId,
                    EmployeeId = l.EmployeeId,
                    EmployeeName = l.Employee != null ? l.Employee.FirstName + " " + l.Employee.LastName : "",
                    LeaveType = l.LeaveType,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Reason = l.Reason,
                    Status = l.Status,
                    DaysCount = (int)(l.EndDate - l.StartDate).TotalDays + 1
                })
                .ToListAsync();
        }

        public async Task<IEnumerable<LeaveRequestDto>>
            GetEmployeeLeaveRequests(int employeeId)
        {
            return await _context.LeaveRequests
                .Include(l => l.Employee)
                .Where(l => l.EmployeeId == employeeId)
                .Select(l => new LeaveRequestDto
                {
                    LeaveRequestId = l.LeaveRequestId,
                    EmployeeId = l.EmployeeId,
                    EmployeeName = l.Employee != null ? l.Employee.FirstName + " " + l.Employee.LastName : "",
                    LeaveType = l.LeaveType,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Reason = l.Reason,
                    Status = l.Status,
                    DaysCount = (int)(l.EndDate - l.StartDate).TotalDays + 1
                })
                .ToListAsync();
        }

        public async Task<LeaveRequestDto>
            CreateLeaveRequest(CreateLeaveRequestDto dto)
        {
            var emp = await _context.Employees.FindAsync(dto.EmployeeId);
            if (emp == null)
            {
                throw new ArgumentException("Employee not found");
            }

            int requestedDays = (int)(dto.EndDate - dto.StartDate).TotalDays + 1;
            if (requestedDays > emp.RemainingLeaveDays)
            {
                throw new InvalidOperationException($"Insufficient leave balance. Requested: {requestedDays} days, remaining: {emp.RemainingLeaveDays} days.");
            }

            // Immediately deduct requested leave days from remaining balance upon creation (Pending status)
            emp.RemainingLeaveDays -= requestedDays;
            if (emp.RemainingLeaveDays < 0)
            {
                emp.RemainingLeaveDays = 0;
            }

            var leaveRequest = new LeaveRequest
            {
                EmployeeId = dto.EmployeeId,
                LeaveType = dto.LeaveType,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                Reason = dto.Reason,
                Status = "Pending"
            };

            _context.LeaveRequests.Add(leaveRequest);

            await _context.SaveChangesAsync();

            string empName = $"{emp.FirstName} {emp.LastName}";

            // Trigger Notification to HR
            try
            {
                var hrUser = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Role.RoleName == "HR");

                if (hrUser != null)
                {
                    await _notificationService.CreateNotification(new CreateNotificationDto
                    {
                        UserId = hrUser.UserId,
                        Title = "New Leave Request Submitted",
                        Message = $"{empName} has requested {requestedDays} day(s) of {leaveRequest.LeaveType} leave."
                    });
                }
            }
            catch (Exception)
            {
                // Gracefully fail notification creation so it doesn't break main flow
            }

            return new LeaveRequestDto
            {
                LeaveRequestId = leaveRequest.LeaveRequestId,
                EmployeeId = leaveRequest.EmployeeId,
                EmployeeName = empName,
                LeaveType = leaveRequest.LeaveType,
                StartDate = leaveRequest.StartDate,
                EndDate = leaveRequest.EndDate,
                Reason = leaveRequest.Reason,
                Status = leaveRequest.Status,
                DaysCount = requestedDays
            };
        }

        public async Task<bool>
            ApproveLeaveRequest(int leaveRequestId)
        {
            var leaveRequest = await _context.LeaveRequests
                .Include(l => l.Employee)
                .FirstOrDefaultAsync(l =>
                    l.LeaveRequestId == leaveRequestId);

            if (leaveRequest == null)
                return false;

            if (leaveRequest.Status != "Approved")
            {
                leaveRequest.Status = "Approved";

                // RemainingLeaveDays deduction is omitted here because it has already been deducted upon request creation (when status was Pending)

                // Trigger Notification to Employee
                try
                {
                    var empUser = await _context.Users
                        .FirstOrDefaultAsync(u => u.EmployeeId == leaveRequest.EmployeeId);

                    if (empUser != null)
                    {
                        await _notificationService.CreateNotification(new CreateNotificationDto
                        {
                            UserId = empUser.UserId,
                            Title = "Leave Request Approved",
                            Message = $"Your {leaveRequest.LeaveType} leave request has been approved."
                        });
                    }
                }
                catch (Exception)
                {
                    // Gracefully fail notification creation
                }
            }

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool>
            RejectLeaveRequest(int leaveRequestId)
        {
            var leaveRequest = await _context.LeaveRequests
                .Include(l => l.Employee)
                .FirstOrDefaultAsync(l =>
                    l.LeaveRequestId == leaveRequestId);

            if (leaveRequest == null)
                return false;

            string oldStatus = leaveRequest.Status;
            leaveRequest.Status = "Rejected";

            // If the old status was not Rejected (i.e. Pending or Approved), we reverse the deduction and restore the leave balance
            if (oldStatus != "Rejected" && leaveRequest.Employee != null)
            {
                int days = (int)(leaveRequest.EndDate - leaveRequest.StartDate).TotalDays + 1;
                if (days > 0)
                {
                    leaveRequest.Employee.RemainingLeaveDays += days;
                }
            }

            // Trigger Notification to Employee
            try
            {
                var empUser = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmployeeId == leaveRequest.EmployeeId);

                if (empUser != null)
                {
                    await _notificationService.CreateNotification(new CreateNotificationDto
                    {
                        UserId = empUser.UserId,
                        Title = "Leave Request Rejected",
                        Message = $"Your {leaveRequest.LeaveType} leave request has been rejected."
                    });
                }
            }
            catch (Exception)
            {
                // Gracefully fail notification creation
            }

            await _context.SaveChangesAsync();

            return true;
        }
    }
}