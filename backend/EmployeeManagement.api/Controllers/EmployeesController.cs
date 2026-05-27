using EmployeeManagement.api.DTOs.Employee;
using EmployeeManagement.api.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;

namespace EmployeeManagement.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]

    [Authorize]
    public class EmployeesController : ControllerBase
    {
        private readonly IEmployeeService _employeeService;

        public EmployeesController(IEmployeeService employeeService)
        {
            _employeeService = employeeService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllEmployees()
        {
            var employees = await _employeeService.GetAllEmployees();

            return Ok(employees);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetEmployeeById(int id)
        {
            var employee = await _employeeService.GetEmployeeById(id);

            if (employee == null)
                return NotFound();

            return Ok(employee);
        }

        [HttpPost]
        public async Task<IActionResult> CreateEmployee([FromBody] CreateEmployeeDto dto)
        {
            try
            {
                var createdEmployee = await _employeeService.CreateEmployee(dto);
                return Ok(createdEmployee);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] UpdateEmployeeDto dto)
        {
            var result = await _employeeService.UpdateEmployee(id, dto);

            if (!result)
                return NotFound();

            return Ok("Employee Updated Successfully");
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var result = await _employeeService.DeleteEmployee(id);

            if (!result)
                return NotFound();

            return Ok("Employee Deleted Successfully");
        }

        [HttpPost("{id}/upload-profile-photo")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadProfilePhoto(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            try
            {
                var relativePath = await _employeeService.UploadProfilePhoto(id, file);
                return Ok(new { imageUrl = relativePath });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Employee not found");
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }

        [HttpPost("{id}/upload-cv")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadCv(int id, IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded");

            try
            {
                var relativePath = await _employeeService.UploadCv(id, file);
                return Ok(new { cvUrl = relativePath });
            }
            catch (KeyNotFoundException)
            {
                return NotFound("Employee not found");
            }
            catch (Exception ex)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
            }
        }
    }
}