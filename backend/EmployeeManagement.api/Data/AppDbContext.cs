using EmployeeManagement.api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Role> Roles { get; set; }

    public DbSet<User> Users { get; set; }

    public DbSet<Employee> Employees { get; set; }

    public DbSet<Department> Departments { get; set; }

    public DbSet<EmployeeLevel> EmployeeLevel { get; set; }

    public DbSet<Attendance> Attendances { get; set; }

    public DbSet<LeaveRequest> LeaveRequests { get; set; }

    public DbSet<Notification> Notifications { get; set; }

    public DbSet<Announcement> Announcements { get; set; }
}