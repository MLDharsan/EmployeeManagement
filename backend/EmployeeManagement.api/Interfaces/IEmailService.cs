using System.Threading.Tasks;

namespace EmployeeManagement.api.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    }
}
