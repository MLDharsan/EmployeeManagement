using EmployeeManagement.api.Data;
using EmployeeManagement.api.DTOs.Employee;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace EmployeeManagement.api.Services
{
    public class EmployeeService : IEmployeeService //implements the all the methods in the IEmployeeService
    {
        private readonly AppDbContext _context; //injects the AppDbContext
        private readonly IEmailService _emailService;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public EmployeeService(AppDbContext context, IEmailService emailService, IWebHostEnvironment webHostEnvironment) 
        {
            _context = context;
            _emailService = emailService;
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task<List<EmployeeDto>> GetAllEmployees()
        {
            var employees = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Level)
                .ToListAsync();

            var userMap = await _context.Users
                .GroupBy(u => u.EmployeeId)
                .ToDictionaryAsync(g => g.Key, g => g.First().UserId);

            return employees.Select(e => new EmployeeDto
            {
                EmployeeId = e.EmployeeId,
                EmployeeCode = e.EmployeeCode,
                FirstName = e.FirstName,
                LastName = e.LastName,
                FullName = e.FirstName + " " + e.LastName,
                Email = e.Email,
                RecoveryEmail = e.RecoveryEmail,
                Phone = e.Phone,
                Address = e.Address,
                DOB = e.DOB,
                Gender = e.Gender,
                JoiningDate = e.JoiningDate,
                DepartmentId = e.DepartmentId,
                DepartmentName = e.Department.DepartmentName,
                LevelId = e.LevelId,
                LevelName = e.Level.LevelName,
                RemainingLeaveDays = e.RemainingLeaveDays,
                AllowedLeaveDays = e.Level.AllowedLeaveDays,
                UserId = userMap.TryGetValue(e.EmployeeId, out var uid) ? uid : null,
                ProfileImage = e.ProfileImage,
                CvPath = e.CvPath
            }).ToList();
        }

        public async Task<EmployeeDto?> GetEmployeeById(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Level)
                .FirstOrDefaultAsync(e => e.EmployeeId == id);

            if (employee == null)
                return null;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == id);

            return new EmployeeDto
            {
                EmployeeId = employee.EmployeeId,
                EmployeeCode = employee.EmployeeCode,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                FullName = employee.FirstName + " " + employee.LastName,
                Email = employee.Email,
                RecoveryEmail = employee.RecoveryEmail,
                Phone = employee.Phone,
                Address = employee.Address,
                DOB = employee.DOB,
                Gender = employee.Gender,
                JoiningDate = employee.JoiningDate,
                DepartmentId = employee.DepartmentId,
                DepartmentName = employee.Department.DepartmentName,
                LevelId = employee.LevelId,
                LevelName = employee.Level.LevelName,
                RemainingLeaveDays = employee.RemainingLeaveDays,
                AllowedLeaveDays = employee.Level.AllowedLeaveDays,
                UserId = user?.UserId,
                ProfileImage = employee.ProfileImage,
                CvPath = employee.CvPath
            };
        }

        public async Task<EmployeeDto> CreateEmployee(CreateEmployeeDto dto)
        {
            if (!string.IsNullOrWhiteSpace(dto.Username))
            {
                var usernameExists = await _context.Users.AnyAsync(u => u.Username.ToLower() == dto.Username.ToLower());
                if (usernameExists)
                {
                    throw new InvalidOperationException("Username is already taken by another employee.");
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.Password))
            {
                if (!Helpers.PasswordHelper.IsValid(dto.Password, out string passwordError))
                {
                    throw new InvalidOperationException(passwordError);
                }
            }

            var level = await _context.EmployeeLevel.FindAsync(dto.LevelId);
            int allowedLeave = level != null ? level.AllowedLeaveDays : 14;

            var employee = new Employee
            {
                EmployeeCode = dto.EmployeeCode,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                RecoveryEmail = dto.RecoveryEmail,
                Phone = dto.Phone,
                Address = dto.Address,
                DOB = dto.DOB,
                Gender = dto.Gender,
                JoiningDate = dto.JoiningDate,
                DepartmentId = dto.DepartmentId,
                LevelId = dto.LevelId,
                RemainingLeaveDays = allowedLeave
            };

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            if (!string.IsNullOrWhiteSpace(dto.Username) && !string.IsNullOrWhiteSpace(dto.Password))
            {
                var employeeRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Employee");
                if (employeeRole != null)
                {
                    var user = new User
                    {
                        Username = dto.Username,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
                        RoleId = employeeRole.RoleId,
                        EmployeeId = employee.EmployeeId
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();

                    // Print beautiful SMTP simulation log to the console
                    Console.WriteLine("\n========================================================================\n" +
                                      "[EMAIL DISPATCH SYSTEM]\n" +
                                      $"Recipient: {employee.Email}\n" +
                                      "Subject: Welcome to the Organization! Your UNIC HR Login Credentials\n" +
                                      "------------------------------------------------------------------------\n" +
                                      $"Hello {employee.FirstName} {employee.LastName},\n\n" +
                                      "Welcome to the team! An administrator has created your employee account.\n" +
                                      "Here are your secure login credentials to access the UNIC HR Portal:\n\n" +
                                      "  Portal URL: http://localhost:4200/login\n" +
                                      $"  Username:   {dto.Username}\n" +
                                      $"  Password:   {dto.Password}\n\n" +
                                      "Please log in and update your contact information immediately.\n" +
                                      "========================================================================\n");

                    string emailSubject = "Welcome to the Organization! Your UNIC HR Login Credentials";
                    string emailBody = $@"
<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);"">
    <div style=""text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;"">
        <h2 style=""color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;"">UNIC HR PORTAL</h2>
        <p style=""color: #6b7280; font-size: 14px; margin: 5px 0 0 0;"">Welcome to the Organization</p>
    </div>
    <div style=""padding: 30px 20px; color: #374151; line-height: 1.6;"">
        <p style=""font-size: 16px; margin-top: 0;"">Hello <strong>{employee.FirstName} {employee.LastName}</strong>,</p>
        <p style=""font-size: 15px;"">Welcome to the team! An administrator has created your employee account. You can now access the UNIC HR Portal using the credentials below:</p>
        
        <div style=""background-color: #f9fafb; border: 1px solid #f3f4f6; border-radius: 8px; padding: 20px; margin: 25px 0;"">
            <table style=""width: 100%; border-collapse: collapse;"">
                <tr>
                    <td style=""padding: 6px 0; color: #6b7280; font-size: 14px; width: 35%;"">Portal URL</td>
                    <td style=""padding: 6px 0; font-size: 14px; font-weight: 600;""><a href=""http://localhost:4200/login"" style=""color: #4f46e5; text-decoration: none;"">http://localhost:4200/login</a></td>
                </tr>
                <tr>
                    <td style=""padding: 6px 0; color: #6b7280; font-size: 14px;"">Username</td>
                    <td style=""padding: 6px 0; font-size: 14px; font-weight: 600; color: #111827;"">{dto.Username}</td>
                </tr>
                <tr>
                    <td style=""padding: 6px 0; color: #6b7280; font-size: 14px;"">Temporary Password</td>
                    <td style=""padding: 6px 0; font-size: 14px; font-weight: 600; color: #111827;""><code>{dto.Password}</code></td>
                </tr>
            </table>
        </div>
        
        <p style=""font-size: 14px; color: #ef4444; font-weight: 500;"">Important: Please log in and update your password and contact information immediately.</p>
        
        <div style=""text-align: center; margin-top: 30px;"">
            <a href=""http://localhost:4200/login"" style=""background-color: #4f46e5; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);"">Log In to Portal</a>
        </div>
    </div>
    <div style=""text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0; color: #9ca3af; font-size: 12px; line-height: 1.4;"">
        <p style=""margin: 0;"">This is an automated system email. Please do not reply directly to this message.</p>
        <p style=""margin: 5px 0 0 0;"">&copy; 2026 UNIC HR Portal. All rights reserved.</p>
    </div>
</div>";

                    // Send email in a fire-and-forget background task so it doesn't block the HTTP request thread.
                    // This ensures the employee is created immediately and the UI success notification is instant.
                    _ = Task.Run(async () =>
                    {
                        try
                        {
                            await _emailService.SendEmailAsync(employee.Email, emailSubject, emailBody);
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[EMAIL SYSTEM ERROR] Failed to send email to {employee.Email}: {ex}");
                        }
                    });
                }
            }

            return new EmployeeDto
            {
                EmployeeId = employee.EmployeeId,
                EmployeeCode = employee.EmployeeCode,
                FirstName = employee.FirstName,
                LastName = employee.LastName,
                FullName = employee.FirstName + " " + employee.LastName,
                Email = employee.Email,
                Phone = employee.Phone,
                Address = employee.Address,
                DOB = employee.DOB,
                Gender = employee.Gender,
                JoiningDate = employee.JoiningDate,
                DepartmentId = employee.DepartmentId,
                LevelId = employee.LevelId,
                RemainingLeaveDays = employee.RemainingLeaveDays,
                AllowedLeaveDays = allowedLeave,
                ProfileImage = employee.ProfileImage,
                CvPath = employee.CvPath
            };
        }

        public async Task<bool> UpdateEmployee(int id, UpdateEmployeeDto dto)
        {
            var employee = await _context.Employees.FindAsync(id);

            if (employee == null)
                return false;

            // Propagate leave capacity differences if LevelId is changed
            if (employee.LevelId != dto.LevelId)
            {
                var oldLevel = await _context.EmployeeLevel.FindAsync(employee.LevelId);
                var newLevel = await _context.EmployeeLevel.FindAsync(dto.LevelId);

                if (oldLevel != null && newLevel != null)
                {
                    int diff = newLevel.AllowedLeaveDays - oldLevel.AllowedLeaveDays;
                    employee.RemainingLeaveDays += diff;
                    if (employee.RemainingLeaveDays < 0)
                    {
                        employee.RemainingLeaveDays = 0;
                    }
                }
            }

            employee.FirstName = dto.FirstName;
            employee.LastName = dto.LastName;
            employee.Email = dto.Email;
            employee.RecoveryEmail = dto.RecoveryEmail;
            employee.Phone = dto.Phone;
            employee.Address = dto.Address;
            employee.DepartmentId = dto.DepartmentId;
            employee.LevelId = dto.LevelId;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteEmployee(int id)
        {
            var employee = await _context.Employees.FindAsync(id);

            if (employee == null)
                return false;

            _context.Employees.Remove(employee);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<string> UploadProfilePhoto(int employeeId, IFormFile file)
        {
            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null)
                throw new KeyNotFoundException("Employee not found");

            // Define folder path
            var uploadsFolder = Path.Combine(_webHostEnvironment.ContentRootPath, "uploads", "profile_photos");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generate unique filename
            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update database record with relative path
            var relativePath = $"/uploads/profile_photos/{fileName}";
            employee.ProfileImage = relativePath;
            await _context.SaveChangesAsync();

            return relativePath;
        }

        public async Task<string> UploadCv(int employeeId, IFormFile file)
        {
            var employee = await _context.Employees.FindAsync(employeeId);
            if (employee == null)
                throw new KeyNotFoundException("Employee not found");

            // Define folder path
            var uploadsFolder = Path.Combine(_webHostEnvironment.ContentRootPath, "uploads", "cvs");
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            // Generate unique filename
            var extension = Path.GetExtension(file.FileName);
            var fileName = $"{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update database record with relative path
            var relativePath = $"/uploads/cvs/{fileName}";
            employee.CvPath = relativePath;
            await _context.SaveChangesAsync();

            return relativePath;
        }
    }
}