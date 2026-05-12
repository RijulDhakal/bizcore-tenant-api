using BizCore.API.Middleware;
using BizCore.Application.DTOs.Contact;
using BizCore.Application.DTOs.Khata;
using BizCore.Application.DTOs.Party;
using BizCore.Application.Interfaces;
using BizCore.Shared.Constants;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/contacts")]
[Authorize]
[RequireModule("invoices")]
public class ContactsController : ControllerBase
{
    private readonly IContactService _contactService;

    public ContactsController(IContactService contactService) => _contactService = contactService;

    private Guid TenantId => Guid.TryParse(User.FindFirst("tid")?.Value, out var tid) ? tid : Guid.Empty;

    [HttpPost]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Create([FromBody] CreateContactDto dto)
    {
        var result = await _contactService.CreateAsync(dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<ContactDto>>>> GetAll(
        [FromQuery] string? type,
        [FromQuery] string? search)
    {
        var result = await _contactService.GetAllAsync(type, search, TenantId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<ContactDto>>> GetById(Guid id)
    {
        var result = await _contactService.GetByIdAsync(id, TenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<ContactDto>>> Update(Guid id, [FromBody] UpdateContactDto dto)
    {
        var result = await _contactService.UpdateAsync(id, dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse>> Delete(Guid id)
    {
        var result = await _contactService.DeleteAsync(id, TenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("{id}/transactions")]
    public async Task<ActionResult<ApiResponse<List<KhataEntryDto>>>> GetTransactions(Guid id)
    {
        var result = await _contactService.GetTransactionsAsync(id, TenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("{id}/ledger")]
    public async Task<ActionResult<ApiResponse<PartyLedgerDto>>> GetLedger(Guid id, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var result = await _contactService.GetPartyLedgerAsync(id, fromDate, toDate);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("{id}/aging")]
    public async Task<ActionResult<ApiResponse<AgingSummaryDto>>> GetAging(Guid id)
    {
        var result = await _contactService.GetPartyAgingAsync(id);
        return result.Success ? Ok(result) : NotFound(result);
    }
}
