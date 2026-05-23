using EmployeeManagement.api.DTOs.EmployeeLevel;

namespace EmployeeManagement.api.Interfaces
{
    public interface IEmployeeLevelService
    {
        Task<List<EmployeeLevelDto>> GetAllLevels();
        Task<EmployeeLevelDto?> GetLevelById(int id);
        Task<EmployeeLevelDto> CreateLevel(CreateEmployeeLevelDto dto);
        Task<bool> UpdateLevel(int id, UpdateEmployeeLevelDto dto);
        Task<bool> DeleteLevel(int id);
    }
}
