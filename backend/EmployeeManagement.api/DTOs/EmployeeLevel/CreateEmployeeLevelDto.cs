using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.api.DTOs.EmployeeLevel
{
    public class CreateEmployeeLevelDto
    {
        [Required]
        [MaxLength(50)]
        public string LevelName { get; set; } = string.Empty;

        [Range(0, 100)]
        public int AllowedLeaveDays { get; set; } = 14;

    }
}
