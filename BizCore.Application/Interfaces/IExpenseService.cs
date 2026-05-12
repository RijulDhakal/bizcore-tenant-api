using BizCore.Application.DTOs.Expense;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BizCore.Application.Interfaces
{
    public interface IExpenseService
    {
        Task<ExpenseDto> CreateExpenseAsync(CreateExpenseDto dto);
        Task<List<ExpenseDto>> GetExpensesAsync(DateTime? dateFrom, DateTime? dateTo, string? category);
        Task<ExpenseDto> UpdateExpenseAsync(Guid id, CreateExpenseDto dto);
        Task DeleteExpenseAsync(Guid id);
        Task<ExpenseSummaryDto> GetSummaryAsync(DateTime? dateFrom, DateTime? dateTo);
    }
}
