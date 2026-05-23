using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.api.DTOs.EmployeeLevel
{
    public class UpdateEmployeeLevelDto
    {
        [Required]
        [MaxLength(50)]
        public string LevelName { get; set; } = string.Empty;

        [Range(0, 100)]
        public int AllowedLeaveDays { get; set; }

    }
}
