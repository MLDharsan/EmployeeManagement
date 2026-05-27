using EmployeeManagement.api.DTOs.Auth;

namespace EmployeeManagement.api.Interfaces
{
    public interface IAuthService
    {
        Task<string?> Login(LoginDto dto);
        Task<bool> ForgotPassword(ForgotPasswordDto dto);
        Task<bool> ResetPassword(ResetPasswordDto dto);
        Task<ChangePasswordResult> ChangePassword(int userId, ChangePasswordDto dto);
    }
}