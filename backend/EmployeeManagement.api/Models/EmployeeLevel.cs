using EmployeeManagement.api.Models;
using System.ComponentModel.DataAnnotations;

namespace EmployeeManagement.api.Models
{
    public class EmployeeLevel
    {
        [Key]
        public int LevelId { get; set; }

        public string LevelName { get; set; } = string.Empty;

        public int AllowedLeaveDays { get; set; } = 14;


        public ICollection<Employee> Employees { get; set; }
            = new List<Employee>();
    }
}