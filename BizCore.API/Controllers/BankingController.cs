using BizCore.Application.DTOs.Banking;
using BizCore.Application.Interfaces;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers
{
[ApiController]
[Route("api/banking")]
[Authorize(Roles = "SuperAdmin,Admin,Owner,Accountant")]
public class BankingController : ControllerBase
    {
        private readonly IBankingService _bankingService;

        public BankingController(IBankingService bankingService)
        {
            _bankingService = bankingService;
        }

        // --- Accounts ---
        
        [HttpPost("accounts")]
        [Authorize(Roles = "SuperAdmin,Admin,Owner")]
        public async Task<IActionResult> CreateAccount(CreateBankAccountDto dto)
        {
            var result = await _bankingService.CreateAccountAsync(dto);
            return Ok(result);
        }

        [HttpGet("accounts")]
        public async Task<IActionResult> GetAccounts()
        {
            var result = await _bankingService.GetAccountsAsync();
            return Ok(result);
        }

        [HttpPut("accounts/{id}")]
        public async Task<IActionResult> UpdateAccount(Guid id, CreateBankAccountDto dto)
        {
            var result = await _bankingService.UpdateAccountAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("accounts/{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,Owner")]
        public async Task<IActionResult> DeleteAccount(Guid id)
        {
            await _bankingService.DeleteAccountAsync(id);
            return Ok();
        }

        // --- Transactions ---

        [HttpPost("transactions")]
        public async Task<IActionResult> CreateTransaction(CreateBankTransactionDto dto)
        {
            var result = await _bankingService.CreateTransactionAsync(dto);
            return Ok(result);
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] Guid? accountId, [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo, [FromQuery] string? type)
        {
            var result = await _bankingService.GetTransactionsAsync(accountId, dateFrom, dateTo, type);
            return Ok(result);
        }

        [HttpDelete("transactions/{id}")]
        [Authorize(Roles = "SuperAdmin,Admin,Owner")]
        public async Task<IActionResult> DeleteTransaction(Guid id)
        {
            await _bankingService.DeleteTransactionAsync(id);
            return Ok();
        }

        // --- Reports ---

        [HttpGet("cashbook")]
        public async Task<IActionResult> GetCashBook([FromQuery] Guid accountId, [FromQuery] DateTime? dateFrom, [FromQuery] DateTime? dateTo)
        {
            var result = await _bankingService.GetCashBookAsync(accountId, dateFrom, dateTo);
            return Ok(result);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var result = await _bankingService.GetTotalBalanceAsync();
            return Ok(ApiResponse<object>.SuccessResult(new { TotalBalance = result }));
        }
    }
}
