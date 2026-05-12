using BizCore.Application.DTOs.Expense;
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
    public class ExpenseService : IExpenseService
    {
        private readonly AppDbContext _context;
        private readonly ITenantService _tenantService;

        public ExpenseService(AppDbContext context, ITenantService tenantService)
        {
            _context = context;
            _tenantService = tenantService;
        }

        public async Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto dto)
        {
            var tenantId = _tenantService.GetTenantId();
            var expense = new Expense
            {
                TenantId = tenantId,
                Title = dto.Title,
                Category = dto.Category,
                Amount = dto.Amount,
                ExpenseDate = dto.ExpenseDate,
                PaymentMode = dto.PaymentMode,
                Reference = dto.Reference,
                Notes = dto.Notes,
                VendorId = dto.VendorId,
                VendorName = dto.VendorName,
                IsRecurring = dto.IsRecurring,
                IsRecurringTemplate = dto.IsRecurringTemplate,
                RecurringFrequency = dto.RecurringFrequency,
                NextDueDate = dto.NextDueDate,
                IsBillable = dto.IsBillable,
                BillableToCustomerId = dto.BillableToCustomerId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.Expenses.AddAsync(expense);
            await _context.SaveChangesAsync();

            // ===== AUTO-LINK TO CASH BOOK =====
            try
            {
                var tid = _tenantService.GetTenantId();
                if (tid == Guid.Empty)
                    tid = await _context.Users
                        .Where(u => !u.IsDeleted &&
                            u.CurrentTenantId != Guid.Empty)
                        .Select(u => u.CurrentTenantId)
                        .FirstOrDefaultAsync() ?? Guid.Empty;

                string accountType = "Cash";
                if (expense.PaymentMode == "Bank Transfer" 
                    || expense.PaymentMode == "Cheque")
                    accountType = "Bank";

                var acct = await _context.BankAccounts
                    .Where(a => a.TenantId == tid
                        && !a.IsDeleted
                        && a.AccountType == accountType)
                    .FirstOrDefaultAsync()
                    ?? await _context.BankAccounts
                        .Where(a => a.TenantId == tid
                            && !a.IsDeleted && a.IsDefault)
                        .FirstOrDefaultAsync()
                    ?? await _context.BankAccounts
                        .Where(a => a.TenantId == tid
                            && !a.IsDeleted)
                        .FirstOrDefaultAsync();

                if (acct != null)
                {
                    acct.CurrentBalance -= expense.Amount;
                    acct.UpdatedAt = DateTime.UtcNow;

                    _context.BankTransactions.Add(
                        new BankTransaction
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tid,
                            AccountId = acct.Id,
                            Type = "Withdrawal",
                            Amount = expense.Amount,
                            BalanceAfter = acct.CurrentBalance,
                            TransactionDate = expense.ExpenseDate,
                            Description = expense.Title,
                            Payee = expense.VendorName 
                                ?? "Expense",
                            Category = expense.Category,
                            LinkedModule = "Expense",
                            LinkedId = expense.Id,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                        });

                    await _context.SaveChangesAsync();
                    Console.WriteLine(
                        $"[Expense→Cash] ✅ Withdrawal " +
                        $"NPR {expense.Amount} → " +
                        $"{acct.AccountName}");
                }
                else
                {
                    Console.WriteLine(
                         "[Expense→Cash] ⚠️ No account found");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine(
                    $"[Expense→Cash] ❌ {ex.Message}\n" +
                    $"{ex.StackTrace}");
            }
            // ===== END AUTO-LINK =====

            return MapToDto(expense);
        }


        public async Task<List<ExpenseDto>> GetExpensesAsync(DateTime? dateFrom, DateTime? dateTo, string? category)
        {
            var tenantId = _tenantService.GetTenantId();
            var query = _context.Expenses.Where(e => e.TenantId == tenantId && !e.IsDeleted);

            if (dateFrom.HasValue)
                query = query.Where(e => e.ExpenseDate >= dateFrom.Value.ToUniversalTime());
            
            if (dateTo.HasValue)
                query = query.Where(e => e.ExpenseDate <= dateTo.Value.ToUniversalTime());

            if (!string.IsNullOrEmpty(category) && category != "All")
                query = query.Where(e => e.Category == category);

            var expenses = await query.OrderByDescending(e => e.ExpenseDate).ToListAsync();
            return expenses.Select(MapToDto).ToList();
        }

        public async Task<ExpenseDto> UpdateExpenseAsync(Guid id, CreateExpenseDto dto)
        {
            var tenantId = _tenantService.GetTenantId();
            var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            
            if (expense == null) throw new Exception("Expense not found");

            expense.Title = dto.Title;
            expense.Category = dto.Category;
            expense.Amount = dto.Amount;
            expense.ExpenseDate = dto.ExpenseDate;
            expense.PaymentMode = dto.PaymentMode;
            expense.Reference = dto.Reference;
            expense.Notes = dto.Notes;
            expense.VendorName = dto.VendorName;
            expense.IsRecurring = dto.IsRecurring;
            expense.IsRecurringTemplate = dto.IsRecurringTemplate;
            expense.RecurringFrequency = dto.RecurringFrequency;
            expense.NextDueDate = dto.NextDueDate;
            expense.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            return MapToDto(expense);
        }

        public async Task DeleteExpenseAsync(Guid id)
        {
            var tenantId = _tenantService.GetTenantId();
            var expense = await _context.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.TenantId == tenantId && !e.IsDeleted);
            
            if (expense != null)
            {
                expense.IsDeleted = true;
                expense.UpdatedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }

        public async Task<ExpenseSummaryDto> GetSummaryAsync(DateTime? dateFrom, DateTime? dateTo)
        {
            var tenantId = _tenantService.GetTenantId();
            var query = _context.Expenses.Where(e => e.TenantId == tenantId && !e.IsDeleted);

            if (dateFrom.HasValue)
                query = query.Where(e => e.ExpenseDate >= dateFrom.Value.ToUniversalTime());
            
            if (dateTo.HasValue)
                query = query.Where(e => e.ExpenseDate <= dateTo.Value.ToUniversalTime());

            var expenses = await query.ToListAsync();
            
            if (!expenses.Any())
            {
                return new ExpenseSummaryDto 
                { 
                    ByCategory = new List<CategorySummaryDto>(),
                    LargestCategory = "N/A"
                };
            }

            var total = expenses.Sum(e => e.Amount);
            var largestExpense = expenses.OrderByDescending(e => e.Amount).First();
            
            var byCategory = expenses.GroupBy(e => e.Category)
                .Select(g => new CategorySummaryDto
                {
                    Category = g.Key,
                    Total = g.Sum(e => e.Amount),
                    Count = g.Count(),
                    Percentage = total > 0 ? (g.Sum(e => e.Amount) / total) * 100 : 0
                })
                .OrderByDescending(c => c.Total)
                .ToList();

            return new ExpenseSummaryDto
            {
                TotalExpenses = total,
                ExpenseCount = expenses.Count,
                ByCategory = byCategory,
                LargestExpense = largestExpense.Amount,
                LargestCategory = byCategory.FirstOrDefault()?.Category ?? "N/A"
            };
        }

        private ExpenseDto MapToDto(Expense e)
        {
            return new ExpenseDto
            {
                Id = e.Id,
                Title = e.Title,
                Category = e.Category,
                Amount = e.Amount,
                ExpenseDate = e.ExpenseDate,
                PaymentMode = e.PaymentMode,
                Reference = e.Reference,
                Notes = e.Notes,
                VendorId = e.VendorId,
                VendorName = e.VendorName,
                IsRecurring = e.IsRecurring,
                IsRecurringTemplate = e.IsRecurringTemplate,
                RecurringFrequency = e.RecurringFrequency,
                NextDueDate = e.NextDueDate,
                LastGeneratedDate = e.LastGeneratedDate,
                IsBillable = e.IsBillable,
                CreatedAt = e.CreatedAt
            };
        }
    }
}
