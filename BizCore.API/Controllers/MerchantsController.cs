using BizCore.API.Middleware;
using BizCore.Application.DTOs;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/merchants")]
[Authorize]
[RequireModule("invoices")]
public class MerchantsController : ControllerBase
{
    private readonly IMerchantService _merchantService;

    public MerchantsController(IMerchantService merchantService)
    {
        _merchantService = merchantService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _merchantService.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _merchantService.GetByIdAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateMerchantDto dto) => Ok(await _merchantService.CreateAsync(dto));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateMerchantDto dto) => Ok(await _merchantService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _merchantService.DeleteAsync(id);
        return NoContent();
    }
}
