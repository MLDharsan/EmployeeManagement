using EmployeeManagement.api.DTOs.EmployeeLevel;
using EmployeeManagement.api.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class EmployeeLevelsController : ControllerBase
    {
        private readonly IEmployeeLevelService _levelService;

        public EmployeeLevelsController(IEmployeeLevelService levelService)
        {
            _levelService = levelService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var levels = await _levelService.GetAllLevels();
            return Ok(levels);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var level = await _levelService.GetLevelById(id);
            if (level == null)
                return NotFound();

            return Ok(level);
        }

        [Authorize(Roles = "HR")]
        [HttpPost]
        public async Task<IActionResult> Create(CreateEmployeeLevelDto dto)
        {
            var created = await _levelService.CreateLevel(dto);
            return Ok(created);
        }

        [Authorize(Roles = "HR")]
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateEmployeeLevelDto dto)
        {
            var updated = await _levelService.UpdateLevel(id, dto);
            if (!updated)
                return NotFound();

            return NoContent();
        }

        [Authorize(Roles = "HR")]
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var deleted = await _levelService.DeleteLevel(id);
            if (!deleted)
            {
                // Can fail because it is not found OR it has active headcounts
                return BadRequest("Failed to delete level. Make sure it exists and has no active employee headcounts.");
            }

            return NoContent();
        }
    }
}
