using System;
using System.Collections.Generic;

namespace BizCore.Application.DTOs.Banking
{
    public class CreateBankAccountDto
    {
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? BranchName { get; set; }
        public decimal OpeningBalance { get; set; }
        public bool IsDefault { get; set; }
    }

    public class BankAccountDto
    {
        public Guid Id { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string AccountType { get; set; } = string.Empty;
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? BranchName { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal CurrentBalance { get; set; }
        public bool IsDefault { get; set; }
        public bool IsActive { get; set; }
        public string Currency { get; set; } = string.Empty;
    }

    public class CreateBankTransactionDto
    {
        public Guid AccountId { get; set; }
        public string Type { get; set; } = string.Empty; // Deposit, Withdrawal, etc.
        public decimal Amount { get; set; }
        public DateTime TransactionDate { get; set; }
        public string? Description { get; set; }
        public string? Reference { get; set; }
        public string? Payee { get; set; }
        public string? Category { get; set; }
    }

    public class BankTransactionDto
    {
        public Guid Id { get; set; }
        public Guid AccountId { get; set; }
        public string AccountName { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal BalanceAfter { get; set; }
        public DateTime TransactionDate { get; set; }
        public string? Description { get; set; }
        public string? Reference { get; set; }
        public string? Payee { get; set; }
        public string? Category { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? LinkedModule { get; set; }
        public Guid? LinkedId { get; set; }
    }

public class CashBookSummaryDto
{
    public decimal OpeningBalance { get; set; }
    public decimal TotalDeposits { get; set; }
    public decimal TotalWithdrawals { get; set; }
    public decimal ClosingBalance { get; set; }
    public List<BankTransactionDto> Transactions { get; set; } = new();
}

public class TransferRequestDto
{
    public Guid FromAccountId { get; set; }
    public Guid ToAccountId { get; set; }
    public decimal Amount { get; set; }
    public DateTime TransferDate { get; set; }
    public string? Description { get; set; }
    public string? ReferenceNo { get; set; }
}

public class TransferResultDto
{
    public Guid FromAccountId { get; set; }
    public Guid ToAccountId { get; set; }
    public decimal Amount { get; set; }
    public decimal FromNewBalance { get; set; }
    public decimal ToNewBalance { get; set; }
    public Guid TransactionId { get; set; }
}
}
