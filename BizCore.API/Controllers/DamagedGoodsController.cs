using BizCore.API.Middleware;
using BizCore.Application.DTOs.Inventory;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/damaged-goods")]
[Authorize]
[RequireModule("inventory")]
public class DamagedGoodsController : ControllerBase
{
    private readonly IDamagedGoodsService _damagedGoodsService;

    public DamagedGoodsController(IDamagedGoodsService damagedGoodsService)
    {
        _damagedGoodsService = damagedGoodsService;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDamagedGoodsDto dto)
    {
        var reportedBy = User.FindFirst("email")?.Value ?? User.Identity?.Name ?? "Unknown";
        var result = await _damagedGoodsService.CreateAsync(dto, reportedBy);
        return Ok(new { success = true, data = result });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo, [FromQuery] string? status)
    {
        var result = await _damagedGoodsService.GetAllAsync(dateFrom, dateTo, status);
        return Ok(new { success = true, data = result });
    }

    [HttpPut("{id}/approve")]
    [Authorize(Roles = "SuperAdmin,Owner,Admin")]
    public async Task<IActionResult> Approve(Guid id)
    {
        var approvedBy = User.FindFirst("email")?.Value ?? User.Identity?.Name ?? "Unknown";
        var result = await _damagedGoodsService.ApproveAsync(id, approvedBy);
        return Ok(new { success = true, data = result });
    }

    [HttpPut("{id}/write-off")]
    [Authorize(Roles = "SuperAdmin,Owner,Admin")]
    public async Task<IActionResult> WriteOff(Guid id)
    {
        var result = await _damagedGoodsService.WriteOffAsync(id);
        return Ok(new { success = true, data = result });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "SuperAdmin,Owner,Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _damagedGoodsService.DeleteAsync(id);
        return Ok(new { success = true });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _damagedGoodsService.GetSummaryAsync();
        return Ok(new { success = true, data = result });
    }
}
