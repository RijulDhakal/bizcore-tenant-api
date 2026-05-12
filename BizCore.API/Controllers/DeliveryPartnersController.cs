using BizCore.API.Middleware;
using BizCore.Application.DTOs;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/delivery-partners")]
[Authorize]
[RequireModule("pos")]
public class DeliveryPartnersController : ControllerBase
{
    private readonly IDeliveryPartnerService _deliveryPartnerService;

    public DeliveryPartnersController(IDeliveryPartnerService deliveryPartnerService)
    {
        _deliveryPartnerService = deliveryPartnerService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() => Ok(await _deliveryPartnerService.GetAllAsync());

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        var item = await _deliveryPartnerService.GetByIdAsync(id);
        return item == null ? NotFound() : Ok(item);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateDeliveryPartnerDto dto) => Ok(await _deliveryPartnerService.CreateAsync(dto));

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(Guid id, UpdateDeliveryPartnerDto dto) => Ok(await _deliveryPartnerService.UpdateAsync(id, dto));

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _deliveryPartnerService.DeleteAsync(id);
        return NoContent();
    }
}
