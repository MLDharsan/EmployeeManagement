using EmployeeManagement.api.DTOs.Employee;

namespace EmployeeManagement.api.Interfaces
{
    public interface IAiService
    {
        Task<ParsedResumeDto?> ParseCvTextAsync(string cvText);
    }
}
