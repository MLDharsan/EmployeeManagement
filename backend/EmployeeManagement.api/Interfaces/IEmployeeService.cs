using EmployeeManagement.api.DTOs.Employee;
using Microsoft.AspNetCore.Http;

namespace EmployeeManagement.api.Interfaces
{
    public interface IEmployeeService
    {
        Task<List<EmployeeDto>> GetAllEmployees();

        Task<EmployeeDto?> GetEmployeeById(int id);

        Task<EmployeeDto> CreateEmployee(CreateEmployeeDto dto);

        Task<bool> UpdateEmployee(int id, UpdateEmployeeDto dto);

        Task<bool> DeleteEmployee(int id);

        Task<string> UploadProfilePhoto(int employeeId, IFormFile file);

        Task<string> UploadCv(int employeeId, IFormFile file);
    }
}


