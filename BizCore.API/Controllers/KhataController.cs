using BizCore.API.Middleware;
using BizCore.Application.DTOs.Khata;
using BizCore.Application.Interfaces;
using BizCore.Shared.Constants;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Diagnostics;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/khata")]
[Authorize]
[RequireModule("khata")]
public class KhataController : ControllerBase
{
    private readonly IKhataService _khataService;
    private readonly ILogger<KhataController> _logger;

    public KhataController(IKhataService khataService, ILogger<KhataController> logger)
    {
        _khataService = khataService;
        _logger = logger;
    }

    private Guid TenantId => Guid.TryParse(User.FindFirst("tid")?.Value, out var tid) ? tid : Guid.Empty;

    [HttpPost("party")]
    public async Task<ActionResult<ApiResponse<PartyDto>>> CreateParty([FromBody] CreatePartyDto dto)
    {
        var result = await _khataService.CreatePartyAsync(dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("parties")]
    public async Task<ActionResult<ApiResponse<List<PartyDto>>>> GetParties()
    {
        var sw = Stopwatch.StartNew();
        var result = await _khataService.GetPartiesAsync(TenantId);
        sw.Stop();
        if (sw.ElapsedMilliseconds > 300)
        {
            _logger.LogWarning("Slow khata parties load for tenant {TenantId}: {ElapsedMs}ms", TenantId, sw.ElapsedMilliseconds);
        }
        return Ok(result);
    }

    [HttpPost("entry")]
    public async Task<ActionResult<ApiResponse<KhataEntryDto>>> CreateEntry([FromBody] CreateKhataEntryDto dto)
    {
        var result = await _khataService.CreateEntryAsync(dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet("entries")]
    public async Task<ActionResult<ApiResponse<List<KhataEntryDto>>>> GetEntries(
        [FromQuery] Guid? partyId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        var sw = Stopwatch.StartNew();
        var result = await _khataService.GetEntriesAsync(partyId, dateFrom, dateTo, TenantId);
        sw.Stop();
        if (sw.ElapsedMilliseconds > 400)
        {
            _logger.LogWarning(
                "Slow khata entries load for tenant {TenantId}, party {PartyId}: {ElapsedMs}ms",
                TenantId,
                partyId,
                sw.ElapsedMilliseconds);
        }
        return Ok(result);
    }

    [HttpGet("party/{id}/balance")]
    public async Task<ActionResult<ApiResponse<PartyBalanceDto>>> GetBalance(Guid id)
    {
        var result = await _khataService.GetPartyBalanceAsync(id, TenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPost("reminder")]
    public async Task<ActionResult<ApiResponse>> CreateReminder([FromBody] CreateReminderDto dto)
    {
        var result = await _khataService.CreateReminderAsync(dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("party/{id}")]
    public async Task<IActionResult> DeleteParty(Guid id)
    {
        var result = await _khataService.DeletePartyAsync(id, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
