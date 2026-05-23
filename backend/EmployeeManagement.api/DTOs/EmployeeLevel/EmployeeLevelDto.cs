namespace EmployeeManagement.api.DTOs.EmployeeLevel
{
    public class EmployeeLevelDto
    {
        public int LevelId { get; set; }
        public string LevelName { get; set; } = string.Empty;
        public int AllowedLeaveDays { get; set; }

    }
}
