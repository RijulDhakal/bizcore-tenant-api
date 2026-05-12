using System;
using System.Collections.Generic;

namespace BizCore.Application.DTOs.Expense
{
public class CreateExpenseDto
{
    public string Title { get; set; }
    public string Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string PaymentMode { get; set; } = "Cash";
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public Guid? VendorId { get; set; }
    public string? VendorName { get; set; }
    public bool IsRecurring { get; set; } = false;
    public bool IsRecurringTemplate { get; set; } = false;
    public string? RecurringFrequency { get; set; }
    public DateTime? NextDueDate { get; set; }
    public bool IsBillable { get; set; } = false;
    public Guid? BillableToCustomerId { get; set; }
}

public class ExpenseDto
{
    public Guid Id { get; set; }
    public string Title { get; set; }
    public string Category { get; set; }
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string PaymentMode { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public Guid? VendorId { get; set; }
    public string? VendorName { get; set; }
    public bool IsRecurring { get; set; }
    public bool IsRecurringTemplate { get; set; }
    public string? RecurringFrequency { get; set; }
    public DateTime? NextDueDate { get; set; }
    public DateTime? LastGeneratedDate { get; set; }
    public bool IsBillable { get; set; }
    public DateTime CreatedAt { get; set; }
}

    public class ExpenseSummaryDto
    {
        public decimal TotalExpenses { get; set; }
        public int ExpenseCount { get; set; }
        public List<CategorySummaryDto> ByCategory { get; set; }
        public decimal LargestExpense { get; set; }
        public string LargestCategory { get; set; }
    }

    public class CategorySummaryDto
    {
        public string Category { get; set; }
        public decimal Total { get; set; }
        public int Count { get; set; }
        public decimal Percentage { get; set; }
    }
}
