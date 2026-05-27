namespace EmployeeManagement.api.DTOs.Auth
{
    public class ChangePasswordResult
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
