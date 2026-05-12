using BizCore.API.Middleware;
using BizCore.Application.DTOs.Invoice;
using BizCore.Application.Interfaces;
using BizCore.Domain.Enums;
using BizCore.Shared.Constants;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/invoices")]
[Authorize]
[RequireModule("invoices")]
public class InvoicesController : ControllerBase
{
    private readonly IInvoiceService _invoiceService;

    public InvoicesController(IInvoiceService invoiceService) => _invoiceService = invoiceService;

    private Guid TenantId => Guid.TryParse(User.FindFirst("tid")?.Value, out var tid) ? tid : Guid.Empty;

    [HttpPost]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> Create([FromBody] CreateInvoiceDto dto)
    {
        var result = await _invoiceService.CreateAsync(dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<InvoiceDto>>>> GetAll(
        [FromQuery] InvoiceStatus? status,
        [FromQuery] Guid? customerId,
        [FromQuery] DateTime? dateFrom,
        [FromQuery] DateTime? dateTo)
    {
        var result = await _invoiceService.GetAllAsync(status, customerId, dateFrom, dateTo, TenantId);
        return Ok(result);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> GetById(Guid id)
    {
        var result = await _invoiceService.GetByIdAsync(id, TenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> Update(Guid id, [FromBody] UpdateInvoiceDto dto)
    {
        var result = await _invoiceService.UpdateAsync(id, dto, TenantId);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    [HttpPut("{id}/mark-paid")]
    public async Task<ActionResult<ApiResponse<InvoiceDto>>> MarkPaid(Guid id)
    {
        var result = await _invoiceService.MarkPaidAsync(id, TenantId);
        return result.Success ? Ok(result) : NotFound(result);
    }

    [HttpGet("{id}/pdf")]
    public async Task<IActionResult> GetPdf(Guid id)
    {
        var result = await _invoiceService.GeneratePdfAsync(id, TenantId);
        if (!result.Success) return NotFound(result);
        return File(result.Data!, "application/pdf", $"invoice-{id}.pdf");
    }
}
