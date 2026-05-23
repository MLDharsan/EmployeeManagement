using EmployeeManagement.api.DTOs.Department;
using EmployeeManagement.api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DepartmentsController : ControllerBase
    {
        private readonly IDepartmentService _departmentService;

        public DepartmentsController(IDepartmentService departmentService)
        {
            _departmentService = departmentService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var departments =
                await _departmentService.GetAllDepartments();

            return Ok(departments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var department =
                await _departmentService.GetDepartmentById(id);

            if (department == null)
                return NotFound();

            return Ok(department);
        }

        [Authorize(Roles = "HR")]
        [HttpPost]
        public async Task<IActionResult> Create(
            CreateDepartmentDto dto)
        {
            var created =
                await _departmentService.CreateDepartment(dto);

            return Ok(created);
        }

        [Authorize(Roles = "HR")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            UpdateDepartmentDto dto)
        {
            var updated =
                await _departmentService.UpdateDepartment(id, dto);

            if (!updated)
                return NotFound();

            return NoContent();
        }

        [Authorize(Roles = "HR")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted =
                await _departmentService.DeleteDepartment(id);

            if (!deleted)
                return NotFound();

            return NoContent();
        }
    }
}