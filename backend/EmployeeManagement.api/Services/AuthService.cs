using System;
using System.Collections.Generic;
using EmployeeManagement.api.Data;
using EmployeeManagement.api.DTOs.Auth;
using EmployeeManagement.api.Interfaces;

using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EmployeeManagement.api.Services
{
    public class AuthService : IAuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;

        public AuthService(AppDbContext context, IConfiguration configuration, IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _emailService = emailService;
        }

        public async Task<string?> Login(LoginDto dto)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .Include(u => u.Employee)
                .FirstOrDefaultAsync(u => u.Username == dto.Username);

            if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
                return null;

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role.RoleName),
                new Claim("UserId", user.UserId.ToString()),
                new Claim("EmployeeId", user.EmployeeId.ToString()),
                new Claim("ProfileImage", user.Employee?.ProfileImage ?? string.Empty)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(
                    _configuration["Jwt:Key"]!));

            var creds = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddMinutes(
                    Convert.ToDouble(
                        _configuration["Jwt:DurationInMinutes"])),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler()
                .WriteToken(token);
        }

        private static readonly Dictionary<string, string> ResetTokens = new(); // token -> email

        public async Task<bool> ForgotPassword(ForgotPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
                return false;

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email.ToLower() == dto.Email.ToLower());
            if (employee == null)
                return false;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == employee.EmployeeId);
            if (user == null)
                return false;

            // Generate a secure reset token
            var token = Guid.NewGuid().ToString("N");
            ResetTokens[token] = dto.Email;

            // Determine where to send the reset link:
            // Use the dedicated RecoveryEmail if it is set, otherwise fall back to the employee's primary email.
            var sendTo = !string.IsNullOrWhiteSpace(employee.RecoveryEmail)
                ? employee.RecoveryEmail
                : employee.Email;

            // Print the simulated email to the console
            Console.WriteLine("\n========================================================================\n" +
                              "[EMAIL DISPATCH SYSTEM]\n" +
                              $"Recipient: {sendTo} {(!string.IsNullOrWhiteSpace(employee.RecoveryEmail) ? "(Recovery Email)" : "(Primary Email)")}\n" +
                              "Subject: Reset Your UNIC HR Portal Password\n" +
                              "------------------------------------------------------------------------\n" +
                              "Hello,\n\n" +
                              "We received a request to reset the password linked to this email address.\n" +
                              "To set a new password, click the recovery link below:\n\n" +
                              $"  Reset Link: http://localhost:4200/reset-password?token={token}\n\n" +
                              "If you did not request this password recovery, please ignore this email.\n" +
                              "========================================================================\n");

            string recoverySubject = "Reset Your UNIC HR Portal Password";
            string recoveryBody = $@"
<div style=""font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.05);"">
    <div style=""text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f0f0f0;"">
        <h2 style=""color: #4f46e5; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;"">UNIC HR PORTAL</h2>
        <p style=""color: #6b7280; font-size: 14px; margin: 5px 0 0 0;"">Password Recovery Service</p>
    </div>
    <div style=""padding: 30px 20px; color: #374151; line-height: 1.6;"">
        <p style=""font-size: 16px; margin-top: 0;"">Hello <strong>{employee.FirstName} {employee.LastName}</strong>,</p>
        <p style=""font-size: 15px;"">We received a request to reset the password for your UNIC HR Portal account. To set a new password, please click the button below:</p>
        
        <div style=""text-align: center; margin: 30px 0;"">
            <a href=""http://localhost:4200/reset-password?token={token}"" style=""background-color: #4f46e5; color: #ffffff; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);"">Reset Your Password</a>
        </div>
        
        <p style=""font-size: 13px; color: #6b7280;"">If the button above doesn't work, copy and paste the following link into your browser:</p>
        <p style=""font-size: 13px; word-break: break-all; color: #4f46e5;""><a href=""http://localhost:4200/reset-password?token={token}"" style=""color: #4f46e5; text-decoration: underline;"">http://localhost:4200/reset-password?token={token}</a></p>
        
        <p style=""font-size: 14px; color: #9ca3af; margin-top: 25px;"">If you did not request this password recovery, you can safely ignore this email.</p>
    </div>
    <div style=""text-align: center; padding-top: 20px; border-top: 1px solid #f0f0f0; color: #9ca3af; font-size: 12px; line-height: 1.4;"">
        <p style=""margin: 0;"">This is an automated system email. Please do not reply directly to this message.</p>
        <p style=""margin: 5px 0 0 0;"">This link was sent to: <strong>{sendTo}</strong></p>
        <p style=""margin: 5px 0 0 0;"">&copy; 2026 UNIC HR Portal. All rights reserved.</p>
    </div>
</div>";

            // Send recovery email in a fire-and-forget background task so it doesn't block the HTTP request.
            _ = Task.Run(async () =>
            {
                try
                {
                    await _emailService.SendEmailAsync(sendTo, recoverySubject, recoveryBody);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[EMAIL SYSTEM ERROR] Failed to send recovery email to {sendTo}: {ex}");
                }
            });

            return true;
        }

        public async Task<bool> ResetPassword(ResetPasswordDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Token) || !ResetTokens.TryGetValue(dto.Token, out var email))
                return false;

            // Validate password complexity
            if (!Helpers.PasswordHelper.IsValid(dto.Password, out string errorMessage))
            {
                throw new InvalidOperationException(errorMessage);
            }

            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Email.ToLower() == email.ToLower());
            if (employee == null)
                return false;

            var user = await _context.Users.FirstOrDefaultAsync(u => u.EmployeeId == employee.EmployeeId);
            if (user == null)
                return false;

            // Update user password using BCrypt
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
            await _context.SaveChangesAsync();

            // Invalidate the token
            ResetTokens.Remove(dto.Token);

            return true;
        }
    }
}