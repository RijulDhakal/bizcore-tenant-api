using BizCore.Application.DTOs.Contact;
using BizCore.Application.DTOs.Khata;
using BizCore.Application.DTOs.Party;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Services;

public class ContactService : IContactService
{
    private readonly AppDbContext _context;

    public ContactService(AppDbContext context) => _context = context;

    public async Task<ApiResponse<ContactDto>> CreateAsync(CreateContactDto dto, Guid tenantId)
    {
        var contact = new Contact
        {
            TenantId = tenantId,
            Name = dto.Name,
            Code = dto.Code,
            BusinessName = dto.BusinessName,
            ContactPerson = dto.ContactPerson,
            PANNumber = dto.PANNumber,
            VATNumber = dto.VATNumber,
            Phone = dto.Phone,
            LandlinePhone = dto.LandlinePhone,
            Email = dto.Email,
            Address = dto.Address,
            City = dto.City,
            Type = dto.Type,
            Notes = dto.Notes,
            CustomerCreditLimit = dto.CustomerCreditLimit,
            CustomerCreditDays = dto.CustomerCreditDays,
            CustomerOpeningBalance = dto.CustomerOpeningBalance,
            SupplierCreditLimit = dto.SupplierCreditLimit,
            SupplierCreditDays = dto.SupplierCreditDays,
            SupplierOpeningBalance = dto.SupplierOpeningBalance
        };

        _context.Contacts.Add(contact);
        await _context.SaveChangesAsync();
        return ApiResponse<ContactDto>.SuccessResult(Map(contact), "Contact created.");
    }

    public async Task<ApiResponse<List<ContactDto>>> GetAllAsync(string? type, string? search, Guid tenantId)
    {
        var query = _context.Contacts.AsQueryable();

        if (!string.IsNullOrEmpty(type) && Enum.TryParse<ContactType>(type, out var contactType))
            query = query.Where(c => c.Type == contactType);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.Contains(search) || (c.Phone != null && c.Phone.Contains(search)));

        var contacts = await query.OrderBy(c => c.Name).ToListAsync();
        return ApiResponse<List<ContactDto>>.SuccessResult(contacts.Select(Map).ToList());
    }

    public async Task<ApiResponse<ContactDto>> GetByIdAsync(Guid id, Guid tenantId)
    {
        var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        if (contact == null)
            return ApiResponse<ContactDto>.FailResult("Contact not found.");
        return ApiResponse<ContactDto>.SuccessResult(Map(contact));
    }

    public async Task<ApiResponse<ContactDto>> UpdateAsync(Guid id, UpdateContactDto dto, Guid tenantId)
    {
        var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        if (contact == null)
            return ApiResponse<ContactDto>.FailResult("Contact not found.");

        contact.Name = dto.Name;
        contact.Code = dto.Code;
        contact.BusinessName = dto.BusinessName;
        contact.ContactPerson = dto.ContactPerson;
        contact.PANNumber = dto.PANNumber;
        contact.VATNumber = dto.VATNumber;
        contact.Phone = dto.Phone;
        contact.LandlinePhone = dto.LandlinePhone;
        contact.Email = dto.Email;
        contact.Address = dto.Address;
        contact.City = dto.City;
        contact.Type = dto.Type;
        contact.Notes = dto.Notes;
        contact.CustomerCreditLimit = dto.CustomerCreditLimit;
        contact.CustomerCreditDays = dto.CustomerCreditDays;
        contact.CustomerOpeningBalance = dto.CustomerOpeningBalance;
        contact.SupplierCreditLimit = dto.SupplierCreditLimit;
        contact.SupplierCreditDays = dto.SupplierCreditDays;
        contact.SupplierOpeningBalance = dto.SupplierOpeningBalance;
        await _context.SaveChangesAsync();
        return ApiResponse<ContactDto>.SuccessResult(Map(contact), "Contact updated.");
    }

    public async Task<ApiResponse> DeleteAsync(Guid id, Guid tenantId)
    {
        var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == id);
        if (contact == null)
            return ApiResponse.FailResult("Contact not found.");

        contact.IsDeleted = true;
        await _context.SaveChangesAsync();
        return ApiResponse.SuccessResult("Contact deleted.");
    }

    public async Task<ApiResponse<List<KhataEntryDto>>> GetTransactionsAsync(Guid contactId, Guid tenantId)
    {
        // Find party matching this contact's phone/name
        var contact = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == contactId);
        if (contact == null)
            return ApiResponse<List<KhataEntryDto>>.FailResult("Contact not found.");

        var entries = await _context.KhataEntries
            .Include(e => e.Party)
            .Where(e => e.Party.Name == contact.Name || e.Party.Phone == contact.Phone)
            .OrderByDescending(e => e.Date)
            .ToListAsync();

        return ApiResponse<List<KhataEntryDto>>.SuccessResult(entries.Select(e => new KhataEntryDto
        {
            Id = e.Id,
            PartyId = e.PartyId,
            PartyName = e.Party.Name,
            Type = (int)e.Type,
            Amount = e.Amount,
            Note = e.Note,
            Date = e.Date,
            CreatedAt = e.CreatedAt
        }).ToList());
    }

    private static ContactDto Map(Contact c) => new()
    {
        Id = c.Id,
        Name = c.Name,
        Code = c.Code,
        BusinessName = c.BusinessName,
        ContactPerson = c.ContactPerson,
        PANNumber = c.PANNumber,
        VATNumber = c.VATNumber,
        Phone = c.Phone,
        LandlinePhone = c.LandlinePhone,
        Email = c.Email,
        Address = c.Address,
        City = c.City,
        Type = c.Type,
        IsActive = c.IsActive,
        Notes = c.Notes,
        CustomerCreditLimit = c.CustomerCreditLimit,
        CustomerCreditDays = c.CustomerCreditDays,
        CustomerOpeningBalance = c.CustomerOpeningBalance,
        CustomerCurrentBalance = c.CustomerCurrentBalance,
        SupplierCreditLimit = c.SupplierCreditLimit,
        SupplierCreditDays = c.SupplierCreditDays,
        SupplierOpeningBalance = c.SupplierOpeningBalance,
        SupplierCurrentBalance = c.SupplierCurrentBalance,
        CreatedAt = c.CreatedAt
    };

    public async Task<ApiResponse<PartyLedgerDto>> GetPartyLedgerAsync(Guid contactId, DateTime? fromDate = null, DateTime? toDate = null)
    {
        var contact = await _context.Contacts.FindAsync(contactId);
        if (contact == null)
            return ApiResponse<PartyLedgerDto>.FailResult("Party not found");

        var entries = new List<PartyLedgerEntryDto>();

        // Get invoices
        var invoices = await _context.Invoices
            .Where(i => i.CustomerId == contactId && !i.IsDeleted)
            .Where(i => fromDate == null || i.IssueDate >= fromDate)
            .Where(i => toDate == null || i.IssueDate <= toDate)
            .OrderBy(i => i.IssueDate)
            .ToListAsync();

        foreach (var inv in invoices)
        {
            entries.Add(new PartyLedgerEntryDto(
                inv.Id,
                inv.IssueDate,
                "Invoice",
                inv.InvoiceNumber,
                $"Invoice for goods",
                inv.TotalAmount,
                0,
                0));
        }

        // Get customer payments (from Khata)
        var payments = await _context.KhataEntries
            .Where(e => e.PartyId == contactId)
            .Where(e => fromDate == null || e.Date >= fromDate)
            .Where(e => toDate == null || e.Date <= toDate)
            .OrderBy(e => e.Date)
            .ToListAsync();

        foreach (var pay in payments)
        {
            entries.Add(new PartyLedgerEntryDto(
                pay.Id,
                pay.Date,
                "Payment",
                $"PAY-{pay.Id.ToString()[..4]}",
                pay.Note ?? "Payment received",
                0,
                pay.Amount,
                0));
        }

        // Sort all entries by date and calculate running balance
        entries = entries.OrderBy(e => e.TransactionDate).ToList();
        decimal runningBalance = contact.CustomerCurrentBalance;
        var calculatedEntries = new List<PartyLedgerEntryDto>();

        foreach (var entry in entries)
        {
            runningBalance = runningBalance + entry.Debit - entry.Credit;
            calculatedEntries.Add(new PartyLedgerEntryDto(
                entry.Id,
                entry.TransactionDate,
                entry.TransactionType,
                entry.ReferenceNumber,
                entry.Description,
                entry.Debit,
                entry.Credit,
                runningBalance));
        }

        // Calculate aging
        var aging = await GetPartyAgingInternalAsync(contactId);

        return ApiResponse<PartyLedgerDto>.SuccessResult(new PartyLedgerDto(
            contact.Id,
            contact.Name,
            contact.CustomerCurrentBalance,
            aging,
            calculatedEntries));
    }

    public async Task<ApiResponse<AgingSummaryDto>> GetPartyAgingAsync(Guid contactId)
    {
        var aging = await GetPartyAgingInternalAsync(contactId);
        return ApiResponse<AgingSummaryDto>.SuccessResult(aging);
    }

    private async Task<AgingSummaryDto> GetPartyAgingInternalAsync(Guid contactId)
    {
        var today = DateTime.UtcNow.Date;

        var unpaidInvoices = await _context.Invoices
            .Where(i => i.CustomerId == contactId && !i.IsDeleted)
            .Where(i => i.Status != InvoiceStatus.Paid)
            .ToListAsync();

        var aging = new AgingSummaryDto(0, 0, 0, 0, 0);

        foreach (var invoice in unpaidInvoices)
        {
            var daysOverdue = (today - invoice.DueDate).Days;
            var amountDue = invoice.TotalAmount;

            if (daysOverdue <= 30)
                aging = aging with { Current = aging.Current + amountDue };
            else if (daysOverdue <= 60)
                aging = aging with { ThirtyOneToSixty = aging.ThirtyOneToSixty + amountDue };
            else if (daysOverdue <= 90)
                aging = aging with { SixtyOneToNinety = aging.SixtyOneToNinety + amountDue };
            else
                aging = aging with { NinetyPlus = aging.NinetyPlus + amountDue };
        }

        aging = aging with { Total = aging.Current + aging.ThirtyOneToSixty + aging.SixtyOneToNinety + aging.NinetyPlus };
        return aging;
    }
}
