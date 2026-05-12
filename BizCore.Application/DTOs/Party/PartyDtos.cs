using BizCore.Domain.Enums;

namespace BizCore.Application.DTOs.Party;

public record PartyDto(
    Guid Id,
    string Name,
    string? Email,
    string? Phone,
    string? Address,
    PartyType PartyType,
    decimal CurrentBalance,
    decimal CreditLimit,
    DateTime? CreatedAt);

public record PartyContactDto(
    Guid Id,
    string Name,
    string? Email,
    string? Phone,
    string? Address,
    PartyType PartyType,
    Currency Currency,
    decimal OpeningBalance,
    decimal CurrentBalance,
    decimal CreditLimit,
    int CreditDays,
    PaymentTerms PaymentTerms,
    string? Notes,
    DateTime? CreatedAt);

public record PartyLedgerEntryDto(
    Guid Id,
    DateTime TransactionDate,
    string TransactionType,
    string ReferenceNumber,
    string Description,
    decimal Debit,
    decimal Credit,
    decimal Balance);

public record AgingSummaryDto(
    decimal Current,
    decimal ThirtyOneToSixty,
    decimal SixtyOneToNinety,
    decimal NinetyPlus,
    decimal Total);

public record PartyLedgerDto(
    Guid PartyId,
    string PartyName,
    decimal CurrentBalance,
    AgingSummaryDto Aging,
    List<PartyLedgerEntryDto> Entries);