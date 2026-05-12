using BizCore.Application.DTOs.Auth;
using BizCore.Application.Interfaces;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/tenant/auth")]
public class TenantAuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public TenantAuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponseDto>>> Login([FromBody] TenantLoginDto dto)
    {
        var result = await _authService.TenantLoginAsync(dto);
        return result.Success ? Ok(result) : Unauthorized(result);
    }
}
