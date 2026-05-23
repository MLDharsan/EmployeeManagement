using EmployeeManagement.api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AttendancesController : ControllerBase
    {
        private readonly IAttendanceService _service;

        public AttendancesController(IAttendanceService service)
        {
            _service = service;
        }

        [Authorize(Roles = "HR")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var attendance = await _service.GetAllAttendance();
            return Ok(attendance);
        }

        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult> GetEmployeeAttendance(int employeeId)
        {
            var attendance = await _service.GetEmployeeAttendance(employeeId);
            return Ok(attendance);
        }

        [HttpPost("check-in/{employeeId}")]
        public async Task<IActionResult> CheckIn(int employeeId)
        {
            var result = await _service.CheckIn(employeeId);
            return Ok(result);
        }

        [HttpPost("check-out/{employeeId}")]
        public async Task<IActionResult> CheckOut(int employeeId)
        {
            var result = await _service.CheckOut(employeeId);
            if (!result)
                return BadRequest("Failed to checkout or already checked out.");

            return Ok(new { message = "Checked out successfully" });
        }
    }
}
