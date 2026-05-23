using EmployeeManagement.api.DTOs.Notification;
using EmployeeManagement.api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController
        : ControllerBase
    {
        private readonly INotificationService _service;

        public NotificationsController(
            INotificationService service)
        {
            _service = service;
        }

        [HttpGet("{userId}")]
        public async Task<IActionResult>
            GetUserNotifications(int userId)
        {
            var notifications =
                await _service.GetUserNotifications(userId);

            return Ok(notifications);
        }

        [HttpPost]
        public async Task<IActionResult>
            Create(CreateNotificationDto dto)
        {
            var notification =
                await _service.CreateNotification(dto);

            return Ok(notification);
        }

        [HttpPut("{id}/read")]
        public async Task<IActionResult>
            MarkAsRead(int id)
        {
            var result =
                await _service.MarkAsRead(id);

            if (!result)
                return NotFound();

            return Ok("Notification marked as read");
        }

        [HttpPut("read-all/{userId}")]
        public async Task<IActionResult>
            MarkAllAsRead(int userId)
        {
            var result =
                await _service.MarkAllAsRead(userId);

            if (!result)
                return NotFound();

            return Ok("All notifications marked as read");
        }
    }
}