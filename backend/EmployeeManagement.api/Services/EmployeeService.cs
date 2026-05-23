using EmployeeManagement.api.Data;
using EmployeeManagement.api.DTOs.Employee;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.api.Services
{
    public class EmployeeService : IEmployeeService
    {
        private readonly AppDbContext _context;

        public EmployeeService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<EmployeeDto>> GetAllEmployees()
        {
            var employees = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Level)
                .ToListAsync();

            return employees.Select(e => new EmployeeDto
            {
                EmployeeId = e.EmployeeId,
                EmployeeCode = e.EmployeeCode,
                FirstName = e.FirstName,
                LastName = e.LastName,
                FullName = e.FirstName + " " + e.LastName,
                Email = e.Email,
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
                AllowedLeaveDays = e.Level.AllowedLeaveDays
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
                DepartmentName = employee.Department.DepartmentName,
                LevelId = employee.LevelId,
                LevelName = employee.Level.LevelName,
                RemainingLeaveDays = employee.RemainingLeaveDays,
                AllowedLeaveDays = employee.Level.AllowedLeaveDays
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

            var level = await _context.EmployeeLevel.FindAsync(dto.LevelId);
            int allowedLeave = level != null ? level.AllowedLeaveDays : 14;

            var employee = new Employee
            {
                EmployeeCode = dto.EmployeeCode,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
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
                        PasswordHash = dto.Password,
                        RoleId = employeeRole.RoleId,
                        EmployeeId = employee.EmployeeId
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();

                    // Print beautiful SMTP simulation log to the console
                    Console.WriteLine("\n========================================================================\n" +
                                      "[EMAIL DISPATCH SYSTEM - SIMULATION]\n" +
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
                AllowedLeaveDays = allowedLeave
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
    }
}