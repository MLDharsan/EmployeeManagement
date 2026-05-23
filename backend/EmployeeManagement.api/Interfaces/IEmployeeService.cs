using EmployeeManagement.api.DTOs.Employee;

namespace EmployeeManagement.api.Interfaces
{
    public interface IEmployeeService
    {
        Task<List<EmployeeDto>> GetAllEmployees();

        Task<EmployeeDto?> GetEmployeeById(int id);

        Task<EmployeeDto> CreateEmployee(CreateEmployeeDto dto);

        Task<bool> UpdateEmployee(int id, UpdateEmployeeDto dto);

        Task<bool> DeleteEmployee(int id);
    }
}


