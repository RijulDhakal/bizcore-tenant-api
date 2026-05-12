using BizCore.Domain.Enums;

namespace BizCore.Application.DTOs.Khata;

public class PartyDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public PartyType Type { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal CurrentBalance { get; set; }
}

public class CreatePartyDto
{
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public PartyType Type { get; set; }
    public decimal OpeningBalance { get; set; } = 0;
}

public class KhataEntryDto
{
    public Guid Id { get; set; }
    public Guid PartyId { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public int Type { get; set; }
    public string TransactionType { get; set; } = "Cash Receipt";
    public string PaymentMode { get; set; } = "Cash";
    public string? ReferenceNumber { get; set; }
    public decimal Amount { get; set; }
    public decimal RunningBalance { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateKhataEntryDto
{
    public Guid PartyId { get; set; }
    public int Type { get; set; }
    public string TransactionType { get; set; } = "Cash Receipt";
    public string PaymentMode { get; set; } = "Cash";
    public string? ReferenceNumber { get; set; }
    public decimal Amount { get; set; }
    public string? Note { get; set; }
    public DateTime Date { get; set; } = DateTime.UtcNow;
}

public class PartyBalanceDto
{
    public Guid PartyId { get; set; }
    public string PartyName { get; set; } = string.Empty;
    public decimal OpeningBalance { get; set; }
    public decimal TotalCredit { get; set; }
    public decimal TotalDebit { get; set; }
    public decimal Balance { get; set; }
}

public class CreateReminderDto
{
    public Guid PartyId { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime ScheduledAt { get; set; }
}
