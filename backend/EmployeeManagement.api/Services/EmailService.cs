using System;
using System.Threading.Tasks;
using EmployeeManagement.api.Interfaces;
using Microsoft.Extensions.Configuration;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;

namespace EmployeeManagement.api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;

        public EmailService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            var server = _configuration["SmtpSettings:Server"];
            var portStr = _configuration["SmtpSettings:Port"];
            var senderName = _configuration["SmtpSettings:SenderName"];
            var senderEmail = _configuration["SmtpSettings:SenderEmail"];
            var username = _configuration["SmtpSettings:Username"];
            var password = _configuration["SmtpSettings:Password"];

            if (string.IsNullOrWhiteSpace(server) || 
                string.IsNullOrWhiteSpace(senderEmail) || 
                string.IsNullOrWhiteSpace(username) || 
                string.IsNullOrWhiteSpace(password))
            {
                Console.WriteLine("\n[EMAIL SYSTEM WARNING] SMTP Settings are not fully configured in appsettings.json. Printing email body to console instead:\n");
                Console.WriteLine($"To: {to}\nSubject: {subject}\nBody:\n{body}\n");
                return;
            }

            int port = int.TryParse(portStr, out var p) ? p : 465;

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName ?? "UNIC HR Portal", senderEmail));
            message.To.Add(new MailboxAddress("", to));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder();
            if (isHtml)
            {
                bodyBuilder.HtmlBody = body;
            }
            else
            {
                bodyBuilder.TextBody = body;
            }

            message.Body = bodyBuilder.ToMessageBody();

            using (var client = new SmtpClient())
            {
                client.Timeout = 10000; // 10 seconds connection timeout

                SecureSocketOptions socketOptions;
                if (port == 465)
                {
                    socketOptions = SecureSocketOptions.SslOnConnect;
                }
                else if (port == 587)
                {
                    socketOptions = SecureSocketOptions.StartTls;
                }
                else
                {
                    socketOptions = SecureSocketOptions.Auto;
                }

                // Connect to the SMTP server securely
                await client.ConnectAsync(server, port, socketOptions);

                // Authenticate with credentials/App Password
                await client.AuthenticateAsync(username, password);

                // Send email
                await client.SendAsync(message);

                // Disconnect cleanly
                await client.DisconnectAsync(true);
            }
        }
    }
}
