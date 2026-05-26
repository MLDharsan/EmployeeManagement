using EmployeeManagement.api.Data;
using EmployeeManagement.api.Models;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.DTOs.Notification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.API.Controllers
{
    [Route("api/[controller]")] //Defines the route template for the controller, where "api/[controller]" means that the route will be prefixed with "api/" followed by the name of the controller (without the "Controller" suffix). For example, if the controller is named "AnnouncementsController", the route for its actions will be "api/announcements".
    [ApiController] //Indicates that this class is an API controller, which means it will handle HTTP requests and return data in a format suitable for APIs (e.g., JSON). This attribute also enables features like automatic model validation and binding source inference, making it easier to create RESTful API endpoints.
    [Authorize] //Requires that the user must be authenticated to access any of the actions in this controller. This means that any request to the endpoints defined in this controller will require a valid authentication token (e.g., JWT) to be included in the request headers, ensuring that only authorized users can access the functionality provided by this controller.
    public class AnnouncementsController : ControllerBase
    {
        private readonly AppDbContext _context; // The application's database context, which allows the controller to interact with the database using Entity Framework Core. This context is typically used to perform CRUD operations on the database entities, such as retrieving, creating, updating, or deleting records related to announcements and notifications.
        private readonly INotificationService _notificationService; // The notification service, which is an abstraction that provides methods for creating and managing notifications. This service is typically used to create notifications for users when certain events occur, such as when a new announcement is created. By using an interface (INotificationService), the controller can depend on an abstraction rather than a concrete implementation, allowing for better separation of concerns and easier testing.

        public AnnouncementsController(AppDbContext context, INotificationService notificationService) // The constructor for the AnnouncementsController, which takes an instance of AppDbContext and INotificationService as parameters. These dependencies are typically injected by the dependency injection container when the controller is instantiated. The constructor assigns these dependencies to the private readonly fields, allowing the controller to use them in its actions to interact with the database and manage notifications.
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var announcements = await _context.Announcements
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();// Retrieve all announcements from the database, ordered by the CreatedAt property in descending order (newest first). The ToListAsync() method is used to execute the query asynchronously and return the results as a list. This allows the application to efficiently retrieve and return the announcements to the client without blocking the main thread.
            return Ok(announcements);
        }

        [HttpPost]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> Create(Announcement announcement)
        {
            announcement.CreatedAt = DateTime.Now;
            _context.Announcements.Add(announcement);
            await _context.SaveChangesAsync();

            // Create notification for ALL users
            try
            {
                var users = await _context.Users.ToListAsync();
                foreach (var user in users)
                {
                    await _notificationService.CreateNotification(new CreateNotificationDto
                    {
                        UserId = user.UserId,
                        Title = "New Announcement Published",
                        Message = $"A new announcement has been posted: \"{announcement.Title}\""
                    });
                }
            }
            catch (Exception)
            {
                // Gracefully fail notification creation so it doesn't block main flow
            }

            return Ok(announcement);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "HR")]
        public async Task<IActionResult> Delete(int id)
        {
            var announcement = await _context.Announcements.FindAsync(id);
            if (announcement == null)
                return NotFound();

            // Delete notifications created for this announcement
            var targetMessageSub = $"\"{announcement.Title}\"";
            var notifications = await _context.Notifications
                .Where(n => n.Title == "New Announcement Published" && n.Message.Contains(targetMessageSub))
                .ToListAsync();

            if (notifications.Any())
            {
                _context.Notifications.RemoveRange(notifications);
            }

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
