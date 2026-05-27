using EmployeeManagement.api.DTOs.Auth;
using EmployeeManagement.api.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace EmployeeManagement.api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService; // The authentication service, which is an abstraction that provides methods for handling user authentication and related operations. This service typically includes methods for logging in users, handling password recovery, and resetting passwords. By using an interface (IAuthService), the controller can depend on an abstraction rather than a concrete implementation, allowing for better separation of concerns and easier testing.

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

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
        {
            var result = await _authService.ForgotPassword(dto);
            if (!result)
                return NotFound(new { message = "Email address not found." });

            return Ok(new { message = "Password recovery link has been simulated & dispatched to your email." });
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
        {
            try
            {
                var result = await _authService.ResetPassword(dto);
                if (!result)
                    return BadRequest(new { message = "Invalid or expired reset token." });

                return Ok(new { message = "Password updated successfully." });
            }
            catch (System.InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
        {
            var userIdClaim = User.FindFirst("UserId")?.Value;
            if (userIdClaim == null || !int.TryParse(userIdClaim, out var userId))
                return Unauthorized();

            try
            {
                var result = await _authService.ChangePassword(userId, dto);
                if (!result.IsSuccess)
                {
                    return BadRequest(new { message = result.Message });
                }

                return Ok(new { message = result.Message });
            }
            catch (System.Exception ex)
            {
                return StatusCode(500, new { message = "An error occurred: " + ex.Message });
            }
        }
    }
}