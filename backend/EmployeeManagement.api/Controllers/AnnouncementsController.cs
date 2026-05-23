using EmployeeManagement.api.Data;
using EmployeeManagement.api.Models;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.DTOs.Notification;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AnnouncementsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public AnnouncementsController(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var announcements = await _context.Announcements
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
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

            _context.Announcements.Remove(announcement);
            await _context.SaveChangesAsync();
            return Ok();
        }
    }
}
