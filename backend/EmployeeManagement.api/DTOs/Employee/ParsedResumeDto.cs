using System;
using System.Collections.Generic;

namespace EmployeeManagement.api.DTOs.Employee
{
    public class ParsedResumeDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public DateTime? DOB { get; set; }
        public string Gender { get; set; } = "Male";
        public List<string> Skills { get; set; } = new();
    }
}
