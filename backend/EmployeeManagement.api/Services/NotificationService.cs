using EmployeeManagement.api.Data;
using EmployeeManagement.api.DTOs.Notification;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.api.Services
{
    public class NotificationService
        : INotificationService
    {
        private readonly AppDbContext _context;

        public NotificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<NotificationDto>>
            GetUserNotifications(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId);

            if (user == null)
                return Enumerable.Empty<NotificationDto>();

            IQueryable<Notification> query = _context.Notifications
                .Include(n => n.User)
                .ThenInclude(u => u.Employee);

            // If the user is HR, return all notifications so they can see sent private communications!
            // Otherwise, filter by their UserId.
            if (user.Role.RoleName != "HR")
            {
                query = query.Where(n => n.UserId == userId);
            }

            return await query
                .OrderByDescending(n => n.CreatedAt)
                .Select(n => new NotificationDto
                {
                    NotificationId = n.NotificationId,
                    UserId = n.UserId,
                    Title = n.Title,
                    Message = n.Message,
                    IsRead = n.IsRead,
                    CreatedAt = n.CreatedAt,
                    SenderName = n.SenderName,
                    RecipientName = n.User.Employee != null ? (n.User.Employee.FirstName + " " + n.User.Employee.LastName) : n.User.Username
                })
                .ToListAsync();
        }

        public async Task<NotificationDto>
            CreateNotification(CreateNotificationDto dto)
        {
            var targetUserId = dto.UserId;
            
            // Auto-routing to HR if UserId is 0 or less
            if (targetUserId <= 0)
            {
                var hrUser = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Role.RoleName == "HR");
                if (hrUser != null)
                {
                    targetUserId = hrUser.UserId;
                }
            }

            // Find the employee ID of the target user
            var targetUser = await _context.Users.FirstOrDefaultAsync(u => u.UserId == targetUserId);
            if (targetUser != null)
            {
                // Find all sibling user accounts linked to this EmployeeId
                var siblingUsers = await _context.Users
                    .Where(u => u.EmployeeId == targetUser.EmployeeId && u.UserId != targetUser.UserId)
                    .ToListAsync();

                foreach (var sibling in siblingUsers)
                {
                    var siblingNotif = new Notification
                    {
                        UserId = sibling.UserId,
                        Title = dto.Title,
                        Message = dto.Message,
                        IsRead = false,
                        CreatedAt = DateTime.Now,
                        SenderName = dto.SenderName
                    };
                    _context.Notifications.Add(siblingNotif);
                }
            }

            var notification = new Notification
            {
                UserId = targetUserId,
                Title = dto.Title,
                Message = dto.Message,
                IsRead = false,
                CreatedAt = DateTime.Now,
                SenderName = dto.SenderName
            };

            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return new NotificationDto
            {
                NotificationId = notification.NotificationId,
                UserId = notification.UserId,
                Title = notification.Title,
                Message = notification.Message,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt,
                SenderName = notification.SenderName,
                RecipientName = targetUser != null && targetUser.Employee != null ? (targetUser.Employee.FirstName + " " + targetUser.Employee.LastName) : (targetUser?.Username ?? string.Empty)
            };
        }

        public async Task<bool>
            MarkAsRead(int notificationId)
        {
            var notification =
                await _context.Notifications
                    .FirstOrDefaultAsync(n =>
                        n.NotificationId == notificationId);

            if (notification == null)
                return false;

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool>
            MarkAllAsRead(int userId)
        {
            var notifications = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            foreach (var n in notifications)
            {
                n.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteNotification(int notificationId)
        {
            var notification = await _context.Notifications.FindAsync(notificationId);
            if (notification == null)
                return false;

            // Find all matching notifications with the same title, message, and created at roughly the same time
            var minTime = notification.CreatedAt.AddSeconds(-5);
            var maxTime = notification.CreatedAt.AddSeconds(5);
            var siblings = await _context.Notifications
                .Where(n => n.Title == notification.Title &&
                            n.Message == notification.Message &&
                            n.CreatedAt >= minTime &&
                            n.CreatedAt <= maxTime)
                .ToListAsync();

            if (siblings.Any())
            {
                _context.Notifications.RemoveRange(siblings);
            }
            else
            {
                _context.Notifications.Remove(notification);
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}