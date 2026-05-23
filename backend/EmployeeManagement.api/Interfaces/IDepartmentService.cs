using EmployeeManagement.api.DTOs.Department;

namespace EmployeeManagement.api.Interfaces
{
    public interface IDepartmentService
    {
        Task<IEnumerable<DepartmentDto>> GetAllDepartments();

        Task<DepartmentDto?> GetDepartmentById(int id);

        Task<DepartmentDto> CreateDepartment(CreateDepartmentDto dto);

        Task<bool> UpdateDepartment(int id, UpdateDepartmentDto dto);

        Task<bool> DeleteDepartment(int id);
    }
}