using BizCore.API.Middleware;
using BizCore.Application.DTOs.Expense;
using BizCore.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers
{
    [ApiController]
    [Route("api/expenses")]
    [Authorize]
[RequireModule("expenses")]
    public class ExpenseController : ControllerBase
    {
        private readonly IExpenseService _expenseService;

        public ExpenseController(IExpenseService expenseService)
        {
            _expenseService = expenseService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateExpenseDto dto)
        {
            var result = await _expenseService.CreateExpenseAsync(dto);
            return Ok(result);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo, [FromQuery] string? category)
        {
            var result = await _expenseService.GetExpensesAsync(dateFrom, dateTo, category);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(Guid id, CreateExpenseDto dto)
        {
            var result = await _expenseService.UpdateExpenseAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _expenseService.DeleteExpenseAsync(id);
            return Ok();
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary([FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
        {
            var result = await _expenseService.GetSummaryAsync(dateFrom, dateTo);
            return Ok(result);
        }

        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = new[] { "Rent", "Electricity", "Water", "Internet", "Salary", "Transport", "Marketing", "Maintenance", "Office Supplies", "Communication", "Tax", "Other" };
            return Ok(categories);
        }
    }
}
