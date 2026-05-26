using EmployeeManagement.api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.api.Data
{
    public static class DbInitializer
    {
        public static void Seed(WebApplication app)
        {
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                // Auto-apply Entity Framework migrations if any are pending
                context.Database.Migrate();

                bool wasEmpty = !context.Roles.Any();

                // 1. Seed Roles if empty
                if (wasEmpty)
                {
                    context.Roles.AddRange(
                        new Role { RoleName = "HR" },
                        new Role { RoleName = "Employee" }
                    );
                    context.SaveChanges();
                }

                // 2. Seed Employee Levels if empty
                if (!context.EmployeeLevel.Any())
                {
                    context.EmployeeLevel.AddRange(
                        new EmployeeLevel { LevelName = "Junior Associate", AllowedLeaveDays = 14 },
                        new EmployeeLevel { LevelName = "Mid Analyst", AllowedLeaveDays = 18 },
                        new EmployeeLevel { LevelName = "Lead Specialist", AllowedLeaveDays = 22 },
                        new EmployeeLevel { LevelName = "Senior Manager", AllowedLeaveDays = 26 }
                    );
                    context.SaveChanges();
                }

                // 3. Seed Departments if empty
                if (!context.Departments.Any())
                {
                    context.Departments.AddRange(
                        new Department 
                        { 
                            DepartmentName = "Human Resources", 
                            Description = "Handles staff administration, recruitment, payroll and employee relations." 
                        },
                        new Department 
                        { 
                            DepartmentName = "IT & Software Engineering", 
                            Description = "Handles company software applications, IT support, and systems infrastructure." 
                        },
                        new Department 
                        { 
                            DepartmentName = "Product & Design", 
                            Description = "Handles product strategy, UI/UX design, and feature definition." 
                        }
                    );
                    context.SaveChanges();
                }

                // Retrieve entities for seeding Employees & Users
                var hrRole = context.Roles.FirstOrDefault(r => r.RoleName == "HR") ?? context.Roles.FirstOrDefault();
                var empRole = context.Roles.FirstOrDefault(r => r.RoleName == "Employee") ?? context.Roles.FirstOrDefault();

                var juniorLevel = context.EmployeeLevel.FirstOrDefault(l => l.LevelName == "Junior Associate") ?? context.EmployeeLevel.FirstOrDefault();
                var seniorManagerLevel = context.EmployeeLevel.FirstOrDefault(l => l.LevelName == "Senior Manager") ?? context.EmployeeLevel.FirstOrDefault();

                var hrDept = context.Departments.FirstOrDefault(d => d.DepartmentName == "Human Resources") ?? context.Departments.FirstOrDefault();
                var itDept = context.Departments.FirstOrDefault(d => d.DepartmentName == "IT & Software Engineering") ?? context.Departments.FirstOrDefault();

                Console.WriteLine($"[SEED-DEBUG] hrRole={hrRole?.RoleName} (ID: {hrRole?.RoleId})");
                Console.WriteLine($"[SEED-DEBUG] empRole={empRole?.RoleName} (ID: {empRole?.RoleId})");
                Console.WriteLine($"[SEED-DEBUG] juniorLevel={juniorLevel?.LevelName} (ID: {juniorLevel?.LevelId})");
                Console.WriteLine($"[SEED-DEBUG] seniorManagerLevel={seniorManagerLevel?.LevelName} (ID: {seniorManagerLevel?.LevelId})");
                Console.WriteLine($"[SEED-DEBUG] hrDept={hrDept?.DepartmentName} (ID: {hrDept?.DepartmentId})");
                Console.WriteLine($"[SEED-DEBUG] itDept={itDept?.DepartmentName} (ID: {itDept?.DepartmentId})");

                // 4. Seed Employees if missing
                var adminEmployee = context.Employees.FirstOrDefault(e => e.EmployeeCode == "EMP001");
                Console.WriteLine($"[SEED-DEBUG] Existing adminEmployee (EMP001)={adminEmployee?.FirstName} {adminEmployee?.LastName} (ID: {adminEmployee?.EmployeeId})");
                if (adminEmployee == null && hrDept != null && seniorManagerLevel != null)
                {
                    adminEmployee = new Employee
                    {
                        EmployeeCode = "EMP001",
                        FirstName = "Admin",
                        LastName = "User",
                        Email = "admin@company.com",
                        Phone = "+1 (555) 019-2834",
                        Address = "100 HQ Boulevard, Suite A, Silicon Valley, CA",
                        DOB = new DateTime(1985, 4, 12),
                        Gender = "Male",
                        JoiningDate = new DateTime(2020, 1, 1),
                        Department = hrDept,
                        Level = seniorManagerLevel,
                        RemainingLeaveDays = 20

                    };
                    context.Employees.Add(adminEmployee);
                    context.SaveChanges();
                }

                var johnEmployee = context.Employees.FirstOrDefault(e => e.EmployeeCode == "EMP101");
                if (johnEmployee == null && itDept != null && juniorLevel != null)
                {
                    johnEmployee = new Employee
                    {
                        EmployeeCode = "EMP101",
                        FirstName = "John",
                        LastName = "Doe",
                        Email = "john.doe@company.com",
                        Phone = "+1 (555) 021-9876",
                        Address = "123 Meadow Lane, Apartment 4B, Austin, TX",
                        DOB = new DateTime(1993, 8, 24),
                        Gender = "Male",
                        JoiningDate = new DateTime(2022, 3, 15),
                        Department = itDept,
                        Level = juniorLevel,
                        RemainingLeaveDays = 14

                    };
                    context.Employees.Add(johnEmployee);
                    context.SaveChanges();
                }

                var existingJohn = context.Employees.FirstOrDefault(e => e.EmployeeCode == "EMP101");
                Console.WriteLine($"[SEED-DEBUG] johnEmployee={johnEmployee?.FirstName} (ID: {johnEmployee?.EmployeeId}), existingJohn={existingJohn?.FirstName} (ID: {existingJohn?.EmployeeId})");
                if (adminEmployee == null) adminEmployee = context.Employees.FirstOrDefault(e => e.EmployeeCode == "EMP001");
                if (johnEmployee == null) johnEmployee = context.Employees.FirstOrDefault(e => e.EmployeeCode == "EMP101");

                Console.WriteLine($"[SEED-DEBUG] Final check: hrRole={hrRole != null}, empRole={empRole != null}, adminEmployee={adminEmployee != null}, johnEmployee={johnEmployee != null}");

                // 5. Seed / Update Users linked to employees and roles
                if (hrRole != null && empRole != null && adminEmployee != null && johnEmployee != null)
                {
                    Console.WriteLine("[SEED-DEBUG] Seeding and updating users...");

                    // admin@company.com
                    var userAdminEmail = context.Users.FirstOrDefault(u => u.Username == "admin@company.com");
                    if (userAdminEmail != null)
                    {
                        if (!IsBCryptHashOf(userAdminEmail.PasswordHash, "Admin@1234"))
                        {
                            userAdminEmail.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234");
                        }
                    }
                    else
                    {
                        context.Users.Add(new User
                        {
                            Username = "admin@company.com",
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234"),
                            RoleId = hrRole.RoleId,
                            EmployeeId = adminEmployee.EmployeeId
                        });
                    }

                    // admin
                    var userAdmin = context.Users.FirstOrDefault(u => u.Username == "admin");
                    if (userAdmin != null)
                    {
                        if (!IsBCryptHashOf(userAdmin.PasswordHash, "Admin@1234"))
                        {
                            userAdmin.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234");
                        }
                    }
                    else
                    {
                        context.Users.Add(new User
                        {
                            Username = "admin",
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@1234"),
                            RoleId = hrRole.RoleId,
                            EmployeeId = adminEmployee.EmployeeId
                        });
                    }

                    // employee@company.com
                    var userEmpEmail = context.Users.FirstOrDefault(u => u.Username == "employee@company.com");
                    if (userEmpEmail != null)
                    {
                        if (!IsBCryptHashOf(userEmpEmail.PasswordHash, "Employee@1234"))
                        {
                            userEmpEmail.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@1234");
                        }
                    }
                    else
                    {
                        context.Users.Add(new User
                        {
                            Username = "employee@company.com",
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@1234"),
                            RoleId = empRole.RoleId,
                            EmployeeId = johnEmployee.EmployeeId
                        });
                    }

                    // employee
                    var userEmp = context.Users.FirstOrDefault(u => u.Username == "employee");
                    if (userEmp != null)
                    {
                        if (!IsBCryptHashOf(userEmp.PasswordHash, "Employee@1234"))
                        {
                            userEmp.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@1234");
                        }
                    }
                    else
                    {
                        context.Users.Add(new User
                        {
                            Username = "employee",
                            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Employee@1234"),
                            RoleId = empRole.RoleId,
                            EmployeeId = johnEmployee.EmployeeId
                        });
                    }

                    context.SaveChanges();
                    Console.WriteLine("[SEED-DEBUG] Seeded and updated users successfully.");
                }
                else
                {
                    Console.WriteLine("[SEED-DEBUG] Skipping user seeding because final check failed.");
                }

                // 6. Seed Announcements if empty and we are seeding for the first time
                if (wasEmpty && !context.Announcements.Any())
                {
                    context.Announcements.AddRange(
                        new Announcement
                        {
                            Title = "Annual Company Retreat 2026!",
                            Message = "We are excited to announce that the annual retreat will be held in Honolulu, Hawaii from July 15th to July 20th. Flights and lodging are fully covered. Please submit your travel preferences in the retreat portal by next Friday.",
                            CreatedAt = DateTime.Now.AddDays(-1)
                        },
                        new Announcement
                        {
                            Title = "Quarterly Town Hall Meeting",
                            Message = "Join us for our Q2 Town Hall meeting on May 25th at 3 PM EST. We will discuss Q1 performance milestones, upcoming product roadmaps, and host a live Q&A session. Attendance is mandatory for all divisions.",
                            CreatedAt = DateTime.Now.AddDays(-3)
                        },
                        new Announcement
                        {
                            Title = "New Premium Health Benefits Package",
                            Message = "We have updated our employee health insurance packages to include complete dental, vision, and mental wellness coverage. Please review the detailed guidelines attached to your email or speak with the benefits coordinator.",
                            CreatedAt = DateTime.Now.AddDays(-6)
                        }
                    );
                    context.SaveChanges();
                }
            }
        }

        private static bool IsBCryptHashOf(string hash, string password)
        {
            if (string.IsNullOrEmpty(hash)) return false;
            try
            {
                return BCrypt.Net.BCrypt.Verify(password, hash);
            }
            catch
            {
                return false;
            }
        }
    }
}
