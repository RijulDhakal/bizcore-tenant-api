using BizCore.Application.DTOs.HR;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[Authorize]
[ApiController]
[Route("api")]
public class SelfServiceController : ControllerBase
{
    private readonly IHRService _hrService;

    public SelfServiceController(IHRService hrService)
    {
        _hrService = hrService;
    }

    [HttpGet("leaves/my")]
    public async Task<IActionResult> GetMyLeaves(string? status)
        => Ok(await _hrService.GetMyLeaveRequestsAsync(status));

    [HttpGet("attendance/my")]
    public async Task<IActionResult> GetMyAttendance(int? month, int? year)
        => Ok(await _hrService.GetMyAttendanceAsync(month, year));

    [HttpPost("leaves")]
    public async Task<IActionResult> CreateLeave(CreateLeaveRequestDto dto)
    {
        var result = await _hrService.CreateLeaveRequestAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("leaves/{id:guid}")]
    public async Task<IActionResult> CancelLeave(Guid id)
    {
        var result = await _hrService.CancelMyLeaveRequestAsync(id);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("hr-queries/my")]
    public async Task<IActionResult> GetMyHrQueries(string? status)
        => Ok(await _hrService.GetMyAssistanceRequestsAsync(status));

    [HttpPost("hr-queries")]
    public async Task<IActionResult> CreateHrQuery(CreateHRAssistanceRequestDto dto)
    {
        var result = await _hrService.CreateAssistanceRequestAsync(dto);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("payroll/my-payslips")]
    public async Task<IActionResult> GetMyPayslips()
        => Ok(await _hrService.GetMyPayslipsAsync());
}
