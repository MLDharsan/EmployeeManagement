using EmployeeManagement.api.DTOs.LeaveRequest;
using EmployeeManagement.api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LeaveRequestsController : ControllerBase
    {
        private readonly ILeaveRequestService _service;

        public LeaveRequestsController(
            ILeaveRequestService service)
        {
            _service = service;
        }

        [Authorize(Roles = "HR")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var leaveRequests =
                await _service.GetAllLeaveRequests();

            return Ok(leaveRequests);
        }

        [Authorize]
        [HttpGet("employee/{employeeId}")]
        public async Task<IActionResult>
            GetEmployeeLeaves(int employeeId)
        {
            var leaveRequests =
                await _service
                    .GetEmployeeLeaveRequests(employeeId);

            return Ok(leaveRequests);
        }

        [Authorize]
        [HttpPost]
        public async Task<IActionResult>
            Create(CreateLeaveRequestDto dto)
        {
            var leaveRequest =
                await _service.CreateLeaveRequest(dto);

            return Ok(leaveRequest);
        }

        [Authorize(Roles = "HR")]
        [HttpPut("{id}/approve")]
        public async Task<IActionResult>
            Approve(int id)
        {
            var result =
                await _service.ApproveLeaveRequest(id);

            if (!result)
                return NotFound();

            return Ok("Leave Approved");
        }

        [Authorize(Roles = "HR")]
        [HttpPut("{id}/reject")]
        public async Task<IActionResult>
            Reject(int id)
        {
            var result =
                await _service.RejectLeaveRequest(id);

            if (!result)
                return NotFound();

            return Ok("Leave Rejected");
        }
    }
}