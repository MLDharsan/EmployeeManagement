using EmployeeManagement.api.DTOs.Auth;
using EmployeeManagement.api.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeManagement.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var token = await _authService.Login(dto);

            if (token == null)
                return Unauthorized("Invalid Username or Password");

            return Ok(new
            {
                Token = token
            });
        }
    }
}