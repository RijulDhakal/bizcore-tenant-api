using BizCore.Application.DTOs.Banking;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace BizCore.Infrastructure.Application.Services
{
    public class BankingService : IBankingService
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public BankingService(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        public async Task<BankAccountDto> CreateAccountAsync(CreateBankAccountDto dto)
        {
            var tenantId = _tenantService.GetTenantId();
            
            var account = new BankAccount
            {
                TenantId = tenantId,
                AccountName = dto.AccountName,
                AccountType = dto.AccountType,
                BankName = dto.BankName,
                AccountNumber = dto.AccountNumber,
                BranchName = dto.BranchName,
                OpeningBalance = dto.OpeningBalance,
                CurrentBalance = dto.OpeningBalance,
                IsDefault = dto.IsDefault,
                CreatedAt = DateTime.UtcNow
            };

            if (dto.IsDefault)
            {
                var existingDefault = await _context.BankAccounts
                    .FirstOrDefaultAsync(a => a.TenantId == tenantId && a.IsDefault && !a.IsDeleted);
                if (existingDefault != null) existingDefault.IsDefault = false;
            }

            await _context.BankAccounts.AddAsync(account);
            await _context.SaveChangesAsync();

            // Create initial transaction for opening balance
            if (dto.OpeningBalance != 0)
            {
                var transaction = new BankTransaction
                {
                    TenantId = tenantId,
                    AccountId = account.Id,
                    Type = "Deposit",
                    Amount = dto.OpeningBalance,
                    BalanceAfter = dto.OpeningBalance,
                    TransactionDate = DateTime.UtcNow,
                    Description = "Opening Balance",
                    Category = "Manual",
                    CreatedAt = DateTime.UtcNow
                };
                await _context.BankTransactions.AddAsync(transaction);
                await _context.SaveChangesAsync();
            }

            return MapToDto(account);
        }

        public async Task<List<BankAccountDto>> GetAccountsAsync()
        {
            var tenantId = _tenantService.GetTenantId();
            var accounts = await _context.BankAccounts
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .OrderByDescending(a => a.IsDefault)
                .ThenBy(a => a.AccountName)
                .ToListAsync();
            
            foreach (var account in accounts)
            {
                await RecalculateBalanceAsync(account.Id);
            }
            
            return accounts.Select(MapToDto).ToList();
        }

        public async Task<BankAccountDto> UpdateAccountAsync(Guid id, CreateBankAccountDto dto)
        {
            var tenantId = _tenantService.GetTenantId();
            var account = await _context.BankAccounts
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted);
            
            if (account == null) throw new Exception("Account not found");

            account.AccountName = dto.AccountName;
            account.AccountType = dto.AccountType;
            account.BankName = dto.BankName;
            account.AccountNumber = dto.AccountNumber;
            account.BranchName = dto.BranchName;
            
            if (dto.IsDefault && !account.IsDefault)
            {
                var existingDefault = await _context.BankAccounts
                    .FirstOrDefaultAsync(a => a.TenantId == tenantId && a.IsDefault && !a.IsDeleted);
                if (existingDefault != null) existingDefault.IsDefault = false;
                account.IsDefault = true;
            }

            account.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return MapToDto(account);
        }

        public async Task DeleteAccountAsync(Guid id)
        {
            var tenantId = _tenantService.GetTenantId();
            var account = await _context.BankAccounts
                .FirstOrDefaultAsync(a => a.Id == id && a.TenantId == tenantId && !a.IsDeleted);
            
            if (account != null)
            {
                account.IsDeleted = true;
                account.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<BankTransactionDto> CreateTransactionAsync(CreateBankTransactionDto dto)
        {
            var tenantId = _tenantService.GetTenantId();
            var account = await _context.BankAccounts
                .FirstOrDefaultAsync(a => a.Id == dto.AccountId && a.TenantId == tenantId && !a.IsDeleted);
            
            if (account == null) throw new Exception("Account not found");

            // Calculate new balance
            decimal newBalance = account.CurrentBalance;
            bool isOutflow = dto.Type == "Withdrawal" || dto.Type == "Payment" || dto.Type == "Transfer Out";
            
            if (isOutflow)
            {
                if (account.CurrentBalance < dto.Amount)
                    throw new Exception("Insufficient balance");
                newBalance -= dto.Amount;
            }
            else
            {
                newBalance += dto.Amount;
            }

            var transaction = new BankTransaction
            {
                TenantId = tenantId,
                AccountId = dto.AccountId,
                Type = dto.Type,
                Amount = dto.Amount,
                BalanceAfter = newBalance,
                TransactionDate = dto.TransactionDate.ToUniversalTime(),
                Description = dto.Description,
                Reference = dto.Reference,
                Payee = dto.Payee,
                Category = dto.Category,
                CreatedAt = DateTime.UtcNow
            };

            account.CurrentBalance = newBalance;
            account.UpdatedAt = DateTime.UtcNow;

            await _context.BankTransactions.AddAsync(transaction);
            await _context.SaveChangesAsync();

            return MapToTransactionDto(transaction, account.AccountName);
        }

        public async Task<List<BankTransactionDto>> GetTransactionsAsync(Guid? accountId, DateTime? dateFrom, DateTime? dateTo, string? type)
        {
            var tenantId = _tenantService.GetTenantId();
            var query = _context.BankTransactions
                .Include(t => t.Account)
                .Where(t => t.TenantId == tenantId && !t.IsDeleted);

            if (accountId.HasValue)
                query = query.Where(t => t.AccountId == accountId.Value);

            if (dateFrom.HasValue)
                query = query.Where(t => t.TransactionDate >= dateFrom.Value.ToUniversalTime());
            
            if (dateTo.HasValue)
                query = query.Where(t => t.TransactionDate <= dateTo.Value.ToUniversalTime());

            if (!string.IsNullOrEmpty(type) && type != "All")
                query = query.Where(t => t.Type == type);

            var transactions = await query
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync();

            // Always newest first for display but chronological for balance if needed
            // Currently using BalanceAfter from DB, but let's ensure it's calculated correctly for display
            var chronological = transactions
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.CreatedAt)
                .ToList();

            decimal running = 0;
            var balanceMap = new Dictionary<Guid, decimal>();
            foreach (var t in chronological)
            {
                bool isDeposit = t.Type == "Deposit" || t.Type == "Receipt" || t.Type == "Transfer In" || t.Type == "Credit";
                if (isDeposit) running += t.Amount;
                else running -= t.Amount;
                balanceMap[t.Id] = running;
            }

            return transactions.Select(t => {
                var dto = MapToTransactionDto(t, t.Account.AccountName);
                if (balanceMap.TryGetValue(t.Id, out decimal bal))
                {
                    dto.BalanceAfter = bal;
                }
                return dto;
            }).ToList();
        }

        public async Task DeleteTransactionAsync(Guid id)
        {
            var tenantId = _tenantService.GetTenantId();
            var transaction = await _context.BankTransactions
                .Include(t => t.Account)
                .FirstOrDefaultAsync(t => t.Id == id && t.TenantId == tenantId && !t.IsDeleted);
            
            if (transaction == null) throw new Exception("Transaction not found");

            // Reverse the balance impact
            bool isOutflow = transaction.Type == "Withdrawal" || transaction.Type == "Payment" || transaction.Type == "Transfer Out";
            if (isOutflow)
            {
                transaction.Account.CurrentBalance += transaction.Amount;
            }
            else
            {
                transaction.Account.CurrentBalance -= transaction.Amount;
            }

            transaction.IsDeleted = true;
            transaction.UpdatedAt = DateTime.UtcNow;
            transaction.Account.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
        }

        public async Task<CashBookSummaryDto> GetCashBookAsync(Guid accountId, DateTime? dateFrom, DateTime? dateTo)
        {
            var tenantId = _tenantService.GetTenantId();
            var account = await _context.BankAccounts
                .FirstOrDefaultAsync(a => a.Id == accountId && a.TenantId == tenantId && !a.IsDeleted);
            
            if (account == null) throw new Exception("Account not found");

            var query = _context.BankTransactions
                .Where(t => t.AccountId == accountId && t.TenantId == tenantId && !t.IsDeleted);

            if (dateFrom.HasValue)
                query = query.Where(t => t.TransactionDate >= dateFrom.Value.ToUniversalTime());
            
            if (dateTo.HasValue)
                query = query.Where(t => t.TransactionDate <= dateTo.Value.ToUniversalTime());

            var transactions = await query
                .OrderByDescending(t => t.TransactionDate)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync();

            var totalDeposits = transactions
                .Where(t => t.Type == "Deposit" || t.Type == "Receipt" || t.Type == "Transfer In" || t.Type == "Credit")
                .Sum(t => t.Amount);

            var totalWithdrawals = transactions
                .Where(t => t.Type == "Withdrawal" || t.Type == "Payment" || t.Type == "Transfer Out" || t.Type == "Debit")
                .Sum(t => t.Amount);

            // Re-calculate balance map for consistency
            var chronological = transactions
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.CreatedAt)
                .ToList();

            decimal running = account.OpeningBalance; 
            // Better yet, let's just use the BalanceAfter relative to the account opening balance if we was loading ALL transactions
            // But if we use filtered dates, we need the balance before the period.
            
            // Standardizing for now:
            var txDtos = transactions.Select(t => MapToTransactionDto(t, account.AccountName)).ToList();

            return new CashBookSummaryDto
            {
                OpeningBalance = account.OpeningBalance,
                TotalDeposits = totalDeposits,
                TotalWithdrawals = totalWithdrawals,
                ClosingBalance = account.CurrentBalance,
                Transactions = txDtos
            };
        }

        public async Task<decimal> GetTotalBalanceAsync()
        {
            var tenantId = _tenantService.GetTenantId();
            return await _context.BankAccounts
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .SumAsync(a => a.CurrentBalance);
        }

        private BankAccountDto MapToDto(BankAccount a)
        {
            return new BankAccountDto
            {
                Id = a.Id,
                AccountName = a.AccountName,
                AccountType = a.AccountType,
                BankName = a.BankName,
                AccountNumber = a.AccountNumber,
                BranchName = a.BranchName,
                OpeningBalance = a.OpeningBalance,
                CurrentBalance = a.CurrentBalance,
                IsDefault = a.IsDefault,
                IsActive = a.IsActive,
                Currency = a.Currency
            };
        }

        private BankTransactionDto MapToTransactionDto(BankTransaction t, string accountName)
        {
            return new BankTransactionDto
            {
                Id = t.Id,
                AccountId = t.AccountId,
                AccountName = accountName,
                Type = t.Type,
                Amount = t.Amount,
                BalanceAfter = t.BalanceAfter,
                TransactionDate = t.TransactionDate,
                Description = t.Description,
                Reference = t.Reference,
                Payee = t.Payee,
                Category = t.Category,
                CreatedAt = t.CreatedAt,
                LinkedModule = t.LinkedModule,
                LinkedId = t.LinkedId
            };
        }
        public async Task<decimal> RecalculateBalanceAsync(Guid accountId)
        {
            var account = await _context.BankAccounts
                .Where(a => a.Id == accountId && !a.IsDeleted)
                .FirstOrDefaultAsync();
            
            if (account == null) return 0;
            
            var transactions = await _context.BankTransactions
                .Where(t => t.AccountId == accountId && !t.IsDeleted)
                .OrderBy(t => t.TransactionDate)
                .ThenBy(t => t.CreatedAt)
                .ToListAsync();
            
            decimal balance = account.OpeningBalance;
            
            foreach (var t in transactions)
            {
                bool isInflow = t.Type == "Deposit" || t.Type == "Receipt" || t.Type == "Transfer In" || t.Type == "Credit";
                if (isInflow)
                    balance += t.Amount;
                else
                    balance -= t.Amount;
            }
            
            if (account.CurrentBalance != balance)
            {
                account.CurrentBalance = balance;
                account.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                Console.WriteLine($"[Banking] Recalculated balance for {account.AccountName}: {balance}");
            }
            
            return balance;
        }

        public async Task<TransferResultDto> TransferAsync(TransferRequestDto request)
        {
            if (request.Amount <= 0)
                return new TransferResultDto { Amount = 0, FromAccountId = Guid.Empty, ToAccountId = Guid.Empty };

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                var tenantId = _tenantService.GetTenantId();
                var fromAccount = await _context.BankAccounts.FindAsync(request.FromAccountId);
                var toAccount = await _context.BankAccounts.FindAsync(request.ToAccountId);

                if (fromAccount == null || toAccount == null)
                    return new TransferResultDto { Amount = 0, FromAccountId = Guid.Empty, ToAccountId = Guid.Empty };

                if (fromAccount.TenantId != tenantId || toAccount.TenantId != tenantId)
                    return new TransferResultDto { Amount = 0, FromAccountId = Guid.Empty, ToAccountId = Guid.Empty };

                if (fromAccount.CurrentBalance < request.Amount)
                    return new TransferResultDto { Amount = 0, FromAccountId = Guid.Empty, ToAccountId = Guid.Empty };

                var year = DateTime.UtcNow.Year;
                var count = await _context.BankTransactions.IgnoreQueryFilters()
                    .CountAsync(t => t.TenantId == tenantId && t.CreatedAt.Year == year) + 1;
                var txnNumber = $"TRF-{year}-{count:D4}";

                var withdrawal = new BankTransaction
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    AccountId = request.FromAccountId,
                    Type = "Withdrawal",
                    Amount = request.Amount,
                    BalanceAfter = fromAccount.CurrentBalance - request.Amount,
                    TransactionDate = request.TransferDate,
                    Description = request.Description ?? $"Transfer to {toAccount.AccountName}",
                    Reference = request.ReferenceNo,
                    Category = "Transfer",
                    LinkedModule = "TRANSFER",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.BankTransactions.Add(withdrawal);

                var deposit = new BankTransaction
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    AccountId = request.ToAccountId,
                    Type = "Deposit",
                    Amount = request.Amount,
                    BalanceAfter = toAccount.CurrentBalance + request.Amount,
                    TransactionDate = request.TransferDate,
                    Description = request.Description ?? $"Transfer from {fromAccount.AccountName}",
                    Reference = request.ReferenceNo,
                    Category = "Transfer",
                    LinkedModule = "TRANSFER",
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.BankTransactions.Add(deposit);

                withdrawal.LinkedTransactionId = deposit.Id;
                deposit.LinkedTransactionId = withdrawal.Id;

                fromAccount.CurrentBalance -= request.Amount;
                fromAccount.UpdatedAt = DateTime.UtcNow;
                toAccount.CurrentBalance += request.Amount;
                toAccount.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                Console.WriteLine($"[Banking] Transfer: NPR {request.Amount} from {fromAccount.AccountName} to {toAccount.AccountName}");

                return new TransferResultDto
                {
                    FromAccountId = request.FromAccountId,
                    ToAccountId = request.ToAccountId,
                    Amount = request.Amount,
                    FromNewBalance = fromAccount.CurrentBalance,
                    ToNewBalance = toAccount.CurrentBalance,
                    TransactionId = withdrawal.Id
                };
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"[Banking] Transfer error: {ex.Message}");
                return new TransferResultDto { Amount = 0, FromAccountId = Guid.Empty, ToAccountId = Guid.Empty };
            }
        }
    }
}
