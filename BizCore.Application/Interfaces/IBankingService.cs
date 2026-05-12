using BizCore.Application.DTOs.Banking;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BizCore.Application.Interfaces
{
    public interface IBankingService
    {
        // Accounts
        Task<BankAccountDto> CreateAccountAsync(CreateBankAccountDto dto);
        Task<List<BankAccountDto>> GetAccountsAsync();
        Task<BankAccountDto> UpdateAccountAsync(Guid id, CreateBankAccountDto dto);
        Task DeleteAccountAsync(Guid id);
        
        // Transactions
        Task<BankTransactionDto> CreateTransactionAsync(CreateBankTransactionDto dto);
        Task<List<BankTransactionDto>> GetTransactionsAsync(Guid? accountId, DateTime? dateFrom, DateTime? dateTo, string? type);
        Task DeleteTransactionAsync(Guid id);
        
        // Reports & Summaries
        Task<CashBookSummaryDto> GetCashBookAsync(Guid accountId, DateTime? dateFrom, DateTime? dateTo);
        Task<decimal> GetTotalBalanceAsync();
        Task<TransferResultDto> TransferAsync(TransferRequestDto request);
    }
}
