using EmployeeManagement.api.DTOs.Auth;

namespace EmployeeManagement.api.Interfaces
{
    public interface IAuthService
    {
        Task<string?> Login(LoginDto dto);
    }
}