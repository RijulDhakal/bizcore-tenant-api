using BizCore.Application.DTOs.Khata;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Services;

public class KhataService : IKhataService
{
    private readonly AppDbContext _context;

    public KhataService(AppDbContext context) => _context = context;

    public async Task<ApiResponse<PartyDto>> CreatePartyAsync(CreatePartyDto dto, Guid tenantId)
    {
        var party = new Party
        {
            TenantId = tenantId,
            Name = dto.Name,
            Phone = dto.Phone,
            Type = dto.Type,
            OpeningBalance = dto.OpeningBalance
        };

        _context.Parties.Add(party);

        if (dto.OpeningBalance != 0)
        {
            var entry = new KhataEntry
            {
                TenantId = tenantId,
                PartyId = party.Id,
                Type = dto.OpeningBalance > 0 ? EntryType.Debit : EntryType.Credit,
                Amount = Math.Abs(dto.OpeningBalance),
                Note = "Opening Balance",
                TransactionType = "Opening Balance",
                PaymentMode = "Cash",
                Date = DateTime.UtcNow,
                RunningBalance = dto.OpeningBalance
            };
            _context.KhataEntries.Add(entry);
        }

        await _context.SaveChangesAsync();

        return ApiResponse<PartyDto>.SuccessResult(await MapPartyWithBalance(party), "Party created.");
    }

    public async Task<ApiResponse<List<PartyDto>>> GetPartiesAsync(Guid tenantId)
    {
        var parties = await _context.Parties
            .AsNoTracking()
            .Where(p => p.TenantId == tenantId && !p.IsDeleted)
            .Include(p => p.Entries.Where(e => !e.IsDeleted))
            .ToListAsync();

        var result = parties.Select(p => new PartyDto
        {
            Id = p.Id,
            Name = p.Name,
            Phone = p.Phone,
            Type = p.Type,
            OpeningBalance = p.OpeningBalance,
            CurrentBalance = p.Entries.Where(e => e.Type == EntryType.Debit).Sum(e => e.Amount)
                           - p.Entries.Where(e => e.Type == EntryType.Credit).Sum(e => e.Amount)
        }).ToList();

        return ApiResponse<List<PartyDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<KhataEntryDto>> CreateEntryAsync(CreateKhataEntryDto dto, Guid tenantId)
    {
        if (tenantId == Guid.Empty)
        {
            tenantId = await _context.Users
                .Where(u => !u.IsDeleted && u.CurrentTenantId != Guid.Empty)
                .Select(u => u.CurrentTenantId)
                .FirstOrDefaultAsync() ?? Guid.Empty;
            Console.WriteLine($"[Khata] Fallback TenantId: {tenantId}");
        }

        var entryType = (EntryType)dto.Type;
        var party = await _context.Parties
            .FirstOrDefaultAsync(p => p.Id == dto.PartyId && p.TenantId == tenantId && !p.IsDeleted);
        if (party == null)
            return ApiResponse<KhataEntryDto>.FailResult("Party not found.");

        // Prevent duplicate entries within 5 seconds (same party, amount, and type)
        var recentDuplicate = await _context.KhataEntries
            .Where(e => e.PartyId == dto.PartyId
                && e.Amount == dto.Amount
                && e.Type == entryType
                && e.TenantId == tenantId
                && !e.IsDeleted
                && e.CreatedAt > DateTime.UtcNow.AddSeconds(-5))
            .FirstOrDefaultAsync();

        if (recentDuplicate != null)
        {
            Console.WriteLine($"[Khata] Duplicate entry prevented: {recentDuplicate.Id}");
            return ApiResponse<KhataEntryDto>.SuccessResult(new KhataEntryDto
            {
                Id = recentDuplicate.Id,
                PartyId = recentDuplicate.PartyId,
                PartyName = party.Name,
                Type = (int)recentDuplicate.Type,
                TransactionType = recentDuplicate.TransactionType,
                PaymentMode = recentDuplicate.PaymentMode,
                ReferenceNumber = recentDuplicate.ReferenceNumber,
                Amount = recentDuplicate.Amount,
                RunningBalance = recentDuplicate.RunningBalance,
                Note = recentDuplicate.Note,
                Date = recentDuplicate.Date,
                CreatedAt = recentDuplicate.CreatedAt
            }, "Duplicate entry prevented.");
        }

        var previousEntries = await _context.KhataEntries
            .AsNoTracking()
            .Where(e => e.PartyId == dto.PartyId && e.TenantId == tenantId && !e.IsDeleted)
            .ToListAsync();

        var existingBalance = previousEntries.Where(e => e.Type == EntryType.Debit).Sum(e => e.Amount)
                            - previousEntries.Where(e => e.Type == EntryType.Credit).Sum(e => e.Amount);

        var runningBalance = entryType == EntryType.Debit
            ? existingBalance + dto.Amount
            : existingBalance - dto.Amount;

        var entry = new KhataEntry
        {
            TenantId = tenantId,
            PartyId = dto.PartyId,
            Type = entryType,
            TransactionType = dto.TransactionType,
            PaymentMode = dto.PaymentMode,
            ReferenceNumber = dto.ReferenceNumber,
            Amount = dto.Amount,
            RunningBalance = runningBalance,
            Note = dto.Note,
            Date = dto.Date
        };

        _context.KhataEntries.Add(entry);
        await _context.SaveChangesAsync();
        
        // ===== AUTO-LINK TO CASH BOOK =====
        try
        {
            var shouldLink = 
                entry.PaymentMode != null &&
                entry.PaymentMode != "Credit" &&
                entry.Note != "Opening Balance" &&
                entry.TransactionType != "Opening Balance";

            if (shouldLink)
            {
                var tid = tenantId;
                if (tid == Guid.Empty)
                {
                    tid = await _context.Users
                        .Where(u => !u.IsDeleted &&
                            u.CurrentTenantId != Guid.Empty)
                        .Select(u => u.CurrentTenantId)
                        .FirstOrDefaultAsync() ?? Guid.Empty;
                }

                var acct = await _context.BankAccounts
                    .Where(a => a.TenantId == tid 
                        && !a.IsDeleted
                        && a.AccountType == 
                            (entry.PaymentMode == "Cash" 
                                ? "Cash" : 
                             entry.PaymentMode == 
                                "Bank Transfer" || 
                             entry.PaymentMode == "Cheque"
                                ? "Bank" : "Cash"))
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
                    bool isDeposit = 
                        entry.Type == EntryType.Credit;
                    
                    if (isDeposit)
                        acct.CurrentBalance += entry.Amount;
                    else
                        acct.CurrentBalance -= entry.Amount;
                    
                    acct.UpdatedAt = DateTime.UtcNow;

                    _context.BankTransactions.Add(
                        new BankTransaction
                        {
                            Id = Guid.NewGuid(),
                            TenantId = tid,
                            AccountId = acct.Id,
                            Type = isDeposit 
                                ? "Deposit" : "Withdrawal",
                            Amount = entry.Amount,
                            BalanceAfter = acct.CurrentBalance,
                            TransactionDate = entry.Date,
                            Description = !string
                                .IsNullOrEmpty(entry.Note)
                                ? entry.Note
                                : $"Khata: {party.Name}",
                            Payee = party.Name,
                            Category = isDeposit 
                                ? "Sales" : "Purchase",
                            LinkedModule = "Khata",
                            LinkedId = entry.Id,
                            CreatedAt = DateTime.UtcNow,
                            UpdatedAt = DateTime.UtcNow,
                        });

                    await _context.SaveChangesAsync();
                    Console.WriteLine(
                        $"[Khata→Cash] ✅ " +
                        $"{(isDeposit ? "Deposit" : "Withdrawal")} " +
                        $"NPR {entry.Amount} → {acct.AccountName}");
                }
                else
                {
                    Console.WriteLine(
                        "[Khata→Cash] ⚠️ No account found");
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(
                $"[Khata→Cash] ❌ {ex.Message}\n" +
                $"{ex.StackTrace}");
        }
        // ===== END AUTO-LINK =====
        
        return ApiResponse<KhataEntryDto>.SuccessResult(new KhataEntryDto
        {
            Id = entry.Id,
            PartyId = entry.PartyId,
            PartyName = party.Name,
            Type = (int)entry.Type,
            TransactionType = entry.TransactionType,
            PaymentMode = entry.PaymentMode ?? string.Empty,
            ReferenceNumber = entry.ReferenceNumber,
            Amount = entry.Amount,
            RunningBalance = entry.RunningBalance,
            Note = entry.Note,
            Date = entry.Date,
            CreatedAt = entry.CreatedAt
        }, "Entry created.");
    }

    public async Task<ApiResponse<List<KhataEntryDto>>> GetEntriesAsync(Guid? partyId, DateTime? dateFrom, DateTime? dateTo, Guid tenantId)
    {
        var query = _context.KhataEntries
            .AsNoTracking()
            .Include(e => e.Party)
            .Where(e => e.TenantId == tenantId && !e.IsDeleted)
            .AsQueryable();

        if (partyId.HasValue)
            query = query.Where(e => e.PartyId == partyId.Value);
        if (dateFrom.HasValue)
            query = query.Where(e => e.Date >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(e => e.Date <= dateTo.Value);

        // Fetch chronological order for correct running balance calculation
        var chronologicalEntries = await query
            .OrderBy(e => e.Date)
            .ThenBy(e => e.CreatedAt)
            .ToListAsync();

        decimal currentRun = 0;
        var resultList = new List<KhataEntryDto>();

        foreach (var e in chronologicalEntries)
        {
            if (e.Type == EntryType.Debit)
                currentRun += e.Amount;
            else
                currentRun -= e.Amount;

            resultList.Add(new KhataEntryDto
            {
                Id = e.Id,
                PartyId = e.PartyId,
                PartyName = e.Party.Name,
                Type = (int)e.Type,
                TransactionType = e.TransactionType,
                PaymentMode = e.PaymentMode,
                ReferenceNumber = e.ReferenceNumber,
                Amount = e.Amount,
                RunningBalance = currentRun, // Use calculated balance
                Note = e.Note,
                Date = e.Date,
                CreatedAt = e.CreatedAt
            });
        }

        // Return newest first for display
        resultList.Reverse();
        return ApiResponse<List<KhataEntryDto>>.SuccessResult(resultList);
    }

    public async Task<ApiResponse<PartyBalanceDto>> GetPartyBalanceAsync(Guid partyId, Guid tenantId)
    {
        var party = await _context.Parties
            .AsNoTracking()
            .Include(p => p.Entries.Where(e => !e.IsDeleted))
            .FirstOrDefaultAsync(p => p.Id == partyId && p.TenantId == tenantId && !p.IsDeleted);
        if (party == null)
            return ApiResponse<PartyBalanceDto>.FailResult("Party not found.");

        var totalCredit = party.Entries.Where(e => e.Type == EntryType.Credit).Sum(e => e.Amount);
        var totalDebit = party.Entries.Where(e => e.Type == EntryType.Debit).Sum(e => e.Amount);

        return ApiResponse<PartyBalanceDto>.SuccessResult(new PartyBalanceDto
        {
            PartyId = partyId,
            PartyName = party.Name,
            OpeningBalance = party.OpeningBalance,
            TotalCredit = totalCredit,
            TotalDebit = totalDebit,
            Balance = totalDebit - totalCredit
        });
    }

    public async Task<ApiResponse> CreateReminderAsync(CreateReminderDto dto, Guid tenantId)
    {
        var party = await _context.Parties.FirstOrDefaultAsync(p => p.Id == dto.PartyId);
        if (party == null)
            return ApiResponse.FailResult("Party not found.");

        var reminder = new KhataReminder
        {
            TenantId = tenantId,
            PartyId = dto.PartyId,
            Message = dto.Message,
            ScheduledAt = dto.ScheduledAt
        };

        _context.KhataReminders.Add(reminder);
        await _context.SaveChangesAsync();
        return ApiResponse.SuccessResult("Reminder created.");
    }

    public async Task<ApiResponse> DeletePartyAsync(Guid partyId, Guid tenantId)
    {
        var party = await _context.Parties
            .Include(p => p.Entries)
            .FirstOrDefaultAsync(p => p.Id == partyId && p.TenantId == tenantId);

        if (party == null)
            return ApiResponse.FailResult("Party not found.");

        party.IsDeleted = true;
        foreach (var entry in party.Entries)
        {
            entry.IsDeleted = true;
        }

        await _context.SaveChangesAsync();
        return ApiResponse.SuccessResult("Party and its transactions deleted.");
    }

    private async Task<PartyDto> MapPartyWithBalance(Party p)
    {
        var entries = await _context.KhataEntries
            .AsNoTracking()
            .Where(e => e.PartyId == p.Id && e.TenantId == p.TenantId && !e.IsDeleted)
            .ToListAsync();
        return new PartyDto
        {
            Id = p.Id,
            Name = p.Name,
            Phone = p.Phone,
            Type = p.Type,
            OpeningBalance = p.OpeningBalance,
            CurrentBalance = entries.Where(e => e.Type == EntryType.Debit).Sum(e => e.Amount)
                           - entries.Where(e => e.Type == EntryType.Credit).Sum(e => e.Amount)
        };
    }
}
