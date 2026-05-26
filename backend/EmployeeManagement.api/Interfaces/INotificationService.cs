using EmployeeManagement.api.DTOs.Notification;

namespace EmployeeManagement.api.Interfaces
{
    public interface INotificationService
    {
        Task<IEnumerable<NotificationDto>>
            GetUserNotifications(int userId);

        Task<NotificationDto>
            CreateNotification(CreateNotificationDto dto);

        Task<bool>
            MarkAsRead(int notificationId);

        Task<bool>
            MarkAllAsRead(int userId);

        Task<bool>
            DeleteNotification(int notificationId);
    }
}