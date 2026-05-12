using BizCore.Application.DTOs.Invoice;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using PdfUnit = QuestPDF.Infrastructure.Unit;

namespace BizCore.Infrastructure.Services;

public class InvoiceService : IInvoiceService
{
    private readonly AppDbContext _context;
    private readonly IInventoryService _inventoryService;

    public InvoiceService(AppDbContext context, IInventoryService inventoryService)
    {
        _context = context;
        _inventoryService = inventoryService;
    }

    public async Task<ApiResponse<InvoiceDto>> CreateAsync(CreateInvoiceDto dto, Guid tenantId)
    {
        Contact? customer = null;
        string customerName;
        
        if (dto.CustomerId == Guid.Empty || dto.CustomerId == Guid.Parse("00000000-0000-0000-0000-000000000000"))
        {
            if (string.IsNullOrWhiteSpace(dto.CustomerName))
                return ApiResponse<InvoiceDto>.FailResult("Customer name is required.");
            
            customer = new Contact
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Name = dto.CustomerName,
                Type = ContactType.Customer,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.Contacts.Add(customer);
            await _context.SaveChangesAsync();
            customerName = dto.CustomerName;
        }
        else
        {
            customer = await _context.Contacts
                .FirstOrDefaultAsync(c => c.Id == dto.CustomerId && c.TenantId == tenantId);
            if (customer == null)
                return ApiResponse<InvoiceDto>.FailResult("Customer not found.");
            customerName = customer.Name;
        }

        var invoiceNumber = await GenerateInvoiceNumberAsync(tenantId);

        var invoiceItems = new List<InvoiceItem>();
        decimal lineSubtotalSum = 0, lineDiscountSum = 0;
        foreach (var item in dto.Items)
        {
            var (lineSub, lineDisc, lineTot) = CalculateLineDiscount(item.Quantity, item.UnitPrice, item.DiscountType, item.DiscountValue);
            invoiceItems.Add(new InvoiceItem
            {
                Description = item.Description,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice,
                DiscountType = item.DiscountType,
                DiscountValue = item.DiscountValue,
                LineSubtotal = lineSub,
                LineDiscountAmount = lineDisc,
                LineTotal = lineTot
            });
            lineSubtotalSum += lineSub;
            lineDiscountSum += lineDisc;
        }

        var subtotal = lineSubtotalSum - lineDiscountSum;
        var invoiceLevelDiscount = dto.DiscountType switch
        {
            DiscountType.Percent => subtotal * (dto.DiscountValue / 100m),
            DiscountType.Fixed => dto.DiscountValue,
            _ => 0
        };
        var taxableAmount = subtotal - invoiceLevelDiscount;
        var taxAmount = dto.ApplyVat ? taxableAmount * 0.13m : 0;
        var grandTotal = taxableAmount + taxAmount;
        var commissionAmount = subtotal * (dto.CommissionRate / 100m);
        var netPayable = (grandTotal + dto.DeliveryFee) - commissionAmount;

        var invoice = new Invoice
        {
            TenantId = tenantId,
            InvoiceNumber = invoiceNumber,
            CustomerId = customer?.Id ?? Guid.Empty,
            BillTo = dto.BillTo,
            IssueDate = dto.IssueDate,
            DueDate = dto.DueDate,
            Status = InvoiceStatus.Draft,
            PaymentTerms = string.IsNullOrWhiteSpace(dto.PaymentTerms) ? "Immediate" : dto.PaymentTerms,
            BuyerPAN = dto.BuyerPAN,
            BankDetails = dto.BankDetails,
            TermsAndConditions = dto.TermsAndConditions,
            IsTaxInvoice = dto.IsTaxInvoice,
            ApplyVat = dto.ApplyVat,
            SubTotal = lineSubtotalSum,
            DiscountTotal = lineDiscountSum,
            DiscountType = dto.DiscountType,
            DiscountValue = dto.DiscountValue,
            TaxAmount = taxAmount,
            TotalAmount = grandTotal,
            InvoiceType = (InvoiceType)dto.InvoiceType,
            MerchantId = dto.MerchantId,
            DeliveryPartnerId = dto.DeliveryPartnerId,
            CommissionRate = dto.CommissionRate,
            CommissionAmount = commissionAmount,
            NetPayable = netPayable,
            DeliveryFee = dto.DeliveryFee,
            DeliveryAddress = dto.DeliveryAddress,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            AmountInWords = AmountToWords(grandTotal),
            Notes = dto.Notes
        };

        _context.Invoices.Add(invoice);
        await _context.SaveChangesAsync();

        foreach (var item in invoiceItems)
        {
            item.InvoiceId = invoice.Id;
            _context.InvoiceItems.Add(item);
        }
        await _context.SaveChangesAsync();

        invoice.Items = invoiceItems;
        return ApiResponse<InvoiceDto>.SuccessResult(MapInvoice(invoice, customerName), "Invoice created.");
    }

    public async Task<ApiResponse<List<InvoiceDto>>> GetAllAsync(InvoiceStatus? status, Guid? customerId, DateTime? dateFrom, DateTime? dateTo, Guid tenantId)
    {
        var query = _context.Invoices
            .Where(i => i.TenantId == tenantId)
            .Include(i => i.Customer)
            .Include(i => i.Items).AsQueryable();

        if (status.HasValue) query = query.Where(i => i.Status == status.Value);
        if (customerId.HasValue) query = query.Where(i => i.CustomerId == customerId.Value);
        if (dateFrom.HasValue) query = query.Where(i => i.IssueDate >= dateFrom.Value);
        if (dateTo.HasValue) query = query.Where(i => i.IssueDate <= dateTo.Value);

        var invoices = await query.OrderByDescending(i => i.IssueDate).ToListAsync();
        return ApiResponse<List<InvoiceDto>>.SuccessResult(invoices.Select(i => MapInvoice(i, i.Customer?.Name ?? i.BillTo ?? "Unknown")).ToList());
    }

    public async Task<ApiResponse<InvoiceDto>> GetByIdAsync(Guid id, Guid tenantId)
    {
        var invoice = await _context.Invoices
            .Where(i => i.Id == id && i.TenantId == tenantId)
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .FirstOrDefaultAsync();

        if (invoice == null)
            return ApiResponse<InvoiceDto>.FailResult("Invoice not found.");

        var customerName = invoice.CustomerId == Guid.Empty || invoice.CustomerId == Guid.Parse("00000000-0000-0000-0000-000000000000")
            ? invoice.BillTo ?? "Unknown Customer"
            : invoice.Customer?.Name ?? "Unknown";
        
        return ApiResponse<InvoiceDto>.SuccessResult(MapInvoice(invoice, customerName));
    }

    public async Task<ApiResponse<InvoiceDto>> UpdateAsync(Guid id, UpdateInvoiceDto dto, Guid tenantId)
    {
        var invoice = await _context.Invoices.Include(i => i.Items).Include(i => i.Customer)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
            return ApiResponse<InvoiceDto>.FailResult("Invoice not found.");

        if (invoice.Status == InvoiceStatus.Paid)
            return ApiResponse<InvoiceDto>.FailResult("Cannot update a paid invoice.");

        // Remove old items
        foreach (var item in invoice.Items) item.IsDeleted = true;

        var subTotal = dto.Items.Sum(i => i.Quantity * i.UnitPrice);
        invoice.CustomerId = dto.CustomerId;
        invoice.BillTo = dto.BillTo;
        invoice.IssueDate = dto.IssueDate;
        invoice.DueDate = dto.DueDate;
        invoice.PaymentTerms = string.IsNullOrWhiteSpace(dto.PaymentTerms) ? "Immediate" : dto.PaymentTerms;
        invoice.BuyerPAN = dto.BuyerPAN;
        invoice.BankDetails = dto.BankDetails;
        invoice.TermsAndConditions = dto.TermsAndConditions;
        invoice.IsTaxInvoice = dto.IsTaxInvoice;
        invoice.TaxAmount = dto.TaxAmount;
        invoice.SubTotal = subTotal;
        invoice.TotalAmount = subTotal + dto.TaxAmount;
        invoice.AmountInWords = AmountToWords(invoice.TotalAmount);
        invoice.Notes = dto.Notes;

        var newItems = dto.Items.Select(i => new InvoiceItem
        {
            InvoiceId = invoice.Id,
            Description = i.Description,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            LineTotal = i.Quantity * i.UnitPrice
        }).ToList();

        foreach (var item in newItems) _context.InvoiceItems.Add(item);
        await _context.SaveChangesAsync();

        return ApiResponse<InvoiceDto>.SuccessResult(MapInvoice(invoice, invoice.Customer.Name), "Invoice updated.");
    }

    public async Task<ApiResponse<InvoiceDto>> MarkPaidAsync(Guid id, Guid tenantId)
    {
        var invoice = await _context.Invoices.Include(i => i.Customer).Include(i => i.Items)
            .FirstOrDefaultAsync(i => i.Id == id && i.TenantId == tenantId);

        if (invoice == null)
            return ApiResponse<InvoiceDto>.FailResult("Invoice not found.");

        if (invoice.Status == InvoiceStatus.Paid)
            return ApiResponse<InvoiceDto>.FailResult("Invoice is already paid.");

        invoice.Status = InvoiceStatus.Paid;
        await _context.SaveChangesAsync();

        // Auto-link to Cash Book
        var defaultAccount = await _context.BankAccounts
            .Where(a => a.TenantId == tenantId && !a.IsDeleted && a.IsDefault)
            .FirstOrDefaultAsync();

        if (defaultAccount != null)
        {
            defaultAccount.CurrentBalance += invoice.TotalAmount;

            var payeeName = invoice.Customer?.Name ?? invoice.BillTo ?? "Unknown";
            var bankTxn = new BankTransaction
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                AccountId = defaultAccount.Id,
                Type = "Deposit",
                Amount = invoice.TotalAmount,
                BalanceAfter = defaultAccount.CurrentBalance,
                TransactionDate = DateTime.UtcNow,
                Description = $"Payment for Invoice #{invoice.InvoiceNumber}",
                Payee = payeeName,
                Category = "Sales",
                LinkedModule = "Invoice",
                LinkedId = invoice.Id,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            _context.BankTransactions.Add(bankTxn);
            await _context.SaveChangesAsync();
        }

        return ApiResponse<InvoiceDto>.SuccessResult(MapInvoice(invoice, invoice.Customer.Name), "Invoice marked as paid.");
    }

    public async Task<ApiResponse<InvoiceDto>> ConfirmInvoiceAsync(Guid id, Guid tenantId, Guid warehouseId)
    {
        var invoice = await _context.Invoices
            .Where(i => i.Id == id && i.TenantId == tenantId)
            .Include(i => i.Items)
            .FirstOrDefaultAsync();

        if (invoice == null)
            return ApiResponse<InvoiceDto>.FailResult("Invoice not found.");

        if (invoice.Status != InvoiceStatus.Draft)
            return ApiResponse<InvoiceDto>.FailResult("Only draft invoices can be confirmed.");

        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            foreach (var item in invoice.Items.Where(i => i.ProductId.HasValue))
            {
                var deductResult = await _inventoryService.DeductStockAsync(new DeductStockDto
                {
                    ProductId = item.ProductId!.Value,
                    WarehouseId = warehouseId,
                    Quantity = item.Quantity,
                    ReferenceType = "INVOICE",
                    ReferenceId = invoice.Id
                });

                if (!deductResult.Success)
                {
                    await transaction.RollbackAsync();
                    return ApiResponse<InvoiceDto>.FailResult($"Stock deduction failed: {deductResult.Message}");
                }
            }

            invoice.Status = InvoiceStatus.Confirmed;
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var customerName = invoice.Customer?.Name ?? invoice.BillTo ?? "Unknown";
            return ApiResponse<InvoiceDto>.SuccessResult(MapInvoice(invoice, customerName), "Invoice confirmed and stock deducted.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return ApiResponse<InvoiceDto>.FailResult($"Error: {ex.Message}");
        }
    }

    public async Task<ApiResponse<byte[]>> GeneratePdfAsync(Guid id, Guid tenantId)
    {
        var invoice = await _context.Invoices
            .Where(i => i.Id == id && i.TenantId == tenantId)
            .Include(i => i.Customer)
            .Include(i => i.Items)
            .FirstOrDefaultAsync();

        if (invoice == null)
            return ApiResponse<byte[]>.FailResult("Invoice not found.");

        if (invoice.CustomerId == Guid.Empty || invoice.CustomerId == Guid.Parse("00000000-0000-0000-0000-000000000000"))
        {
            invoice.Customer = new Contact { Name = invoice.BillTo ?? "Unknown Customer" };
        }

        QuestPDF.Settings.License = LicenseType.Community;

        var pdf = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, PdfUnit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Text("INVOICE").FontSize(28).Bold().FontColor("#1e293b");
                        row.ConstantItem(200).AlignRight().Text(invoice.InvoiceNumber).FontSize(14).FontColor("#64748b");
                    });
                    col.Item().PaddingTop(4).LineHorizontal(1).LineColor("#e2e8f0");
                });

                page.Content().PaddingVertical(1, PdfUnit.Centimetre).Column(col =>
                {
                    col.Item().Row(row =>
                    {
                        row.RelativeItem().Column(c =>
                        {
                            c.Item().Text("Bill To").Bold().FontColor("#64748b");
                            c.Item().Text(invoice.Customer.Name).Bold().FontSize(13);
                            if (!string.IsNullOrEmpty(invoice.Customer.Phone))
                                c.Item().Text(invoice.Customer.Phone).FontColor("#64748b");
                        });
                        row.ConstantItem(200).AlignRight().Column(c =>
                        {
                            c.Item().Text($"Issue Date: {invoice.IssueDate:yyyy-MM-dd}").FontColor("#64748b");
                            c.Item().Text($"Due Date: {invoice.DueDate:yyyy-MM-dd}").FontColor("#64748b");
                            c.Item().Text($"Status: {invoice.Status}").Bold().FontColor(invoice.Status == InvoiceStatus.Paid ? "#16a34a" : "#ea580c");
                        });
                    });

                    col.Item().PaddingTop(20).Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(4);
                            cols.RelativeColumn(1);
                            cols.RelativeColumn(2);
                            cols.RelativeColumn(2);
                        });

                        table.Header(h =>
                        {
                            h.Cell().Background("#1e293b").Padding(8).Text("Description").FontColor(Colors.White).Bold();
                            h.Cell().Background("#1e293b").Padding(8).AlignRight().Text("Qty").FontColor(Colors.White).Bold();
                            h.Cell().Background("#1e293b").Padding(8).AlignRight().Text("Unit Price").FontColor(Colors.White).Bold();
                            h.Cell().Background("#1e293b").Padding(8).AlignRight().Text("Amount").FontColor(Colors.White).Bold();
                        });

                        var isAlt = false;
                        foreach (var item in invoice.Items)
                        {
                            var bg = isAlt ? "#f8fafc" : "#ffffff";
                            table.Cell().Background(bg).Padding(8).Text(item.Description);
                            table.Cell().Background(bg).Padding(8).AlignRight().Text(item.Quantity.ToString("F2"));
                            table.Cell().Background(bg).Padding(8).AlignRight().Text(item.UnitPrice.ToString("F2"));
                            table.Cell().Background(bg).Padding(8).AlignRight().Text(item.LineTotal.ToString("F2"));
                            isAlt = !isAlt;
                        }
                    });

                    col.Item().PaddingTop(20).AlignRight().Column(c =>
                    {
                        c.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Subtotal").FontColor("#64748b");
                            r.ConstantItem(120).AlignRight().Text($"NPR {invoice.SubTotal:F2}");
                        });
                        if (invoice.ApplyVat && invoice.TaxAmount > 0)
                        {
                            c.Item().Row(r =>
                            {
                                r.RelativeItem().Text("VAT (13%)").FontColor("#64748b");
                                r.ConstantItem(120).AlignRight().Text($"NPR {invoice.TaxAmount:F2}");
                            });
                        }
                        c.Item().PaddingTop(4).LineHorizontal(1).LineColor("#e2e8f0");
                        c.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Total").Bold().FontSize(13);
                            r.ConstantItem(120).AlignRight().Text($"NPR {invoice.TotalAmount:F2}").Bold().FontSize(13);
                        });
                    });

                    if (!string.IsNullOrEmpty(invoice.Notes))
                    {
                        col.Item().PaddingTop(20).Text("Notes").Bold().FontColor("#64748b");
                        col.Item().Text(invoice.Notes).FontColor("#64748b");
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Generated by BizCore · ").FontColor("#64748b").FontSize(9);
                    text.Span(DateTime.UtcNow.ToString("yyyy-MM-dd")).FontColor("#64748b").FontSize(9);
                });
            });
        });

        var bytes = pdf.GeneratePdf();
        return ApiResponse<byte[]>.SuccessResult(bytes);
    }

    private async Task<string> GenerateInvoiceNumberAsync(Guid tenantId)
    {
        var year = DateTime.UtcNow.Year;
        var count = await _context.Invoices
            .IgnoreQueryFilters()
            .CountAsync(i => i.TenantId == tenantId && i.CreatedAt.Year == year) + 1;
        return $"INV-{year}-{count:D4}";
    }

    private static InvoiceDto MapInvoice(Invoice i, string customerName) => new()
    {
        Id = i.Id,
        InvoiceNumber = i.InvoiceNumber,
        CustomerId = i.CustomerId,
        CustomerName = customerName,
        BillTo = i.BillTo,
        IssueDate = i.IssueDate,
        DueDate = i.DueDate,
        Status = i.Status,
        PaymentTerms = i.PaymentTerms,
        BuyerPAN = i.BuyerPAN,
        BankDetails = i.BankDetails,
        TermsAndConditions = i.TermsAndConditions,
        AmountInWords = i.AmountInWords,
        IsTaxInvoice = i.IsTaxInvoice,
        ApplyVat = i.ApplyVat,
        SubTotal = i.SubTotal,
        DiscountTotal = i.DiscountTotal,
        DiscountType = i.DiscountType,
        DiscountValue = i.DiscountValue,
        TaxAmount = i.TaxAmount,
        TotalAmount = i.TotalAmount,
        InvoiceType = i.InvoiceType,
        MerchantId = i.MerchantId,
        DeliveryPartnerId = i.DeliveryPartnerId,
        CommissionRate = i.CommissionRate,
        CommissionAmount = i.CommissionAmount,
        NetPayable = i.NetPayable,
        DeliveryFee = i.DeliveryFee,
        DeliveryAddress = i.DeliveryAddress,
        ExpectedDeliveryDate = i.ExpectedDeliveryDate,
        Notes = i.Notes,
        CreatedAt = i.CreatedAt,
        Items = i.Items.Where(item => !item.IsDeleted).Select(item => new InvoiceItemDto
        {
            Id = item.Id,
            Description = item.Description,
            Quantity = item.Quantity,
            UnitPrice = item.UnitPrice,
            DiscountType = item.DiscountType,
            DiscountValue = item.DiscountValue,
            LineSubtotal = item.LineSubtotal,
            LineDiscountAmount = item.LineDiscountAmount,
            LineTotal = item.LineTotal
        }).ToList()
    };

    private static (decimal lineSubtotal, decimal lineDiscount, decimal lineTotal) CalculateLineDiscount(
        decimal quantity, decimal unitPrice, DiscountType discountType, decimal discountValue)
    {
        var lineSubtotal = quantity * unitPrice;
        var lineDiscount = discountType switch
        {
            DiscountType.Percent => lineSubtotal * (discountValue / 100m),
            DiscountType.Fixed => discountValue,
            _ => 0
        };
        var lineTotal = lineSubtotal - lineDiscount;
        return (lineSubtotal, lineDiscount, lineTotal);
    }

    private static string AmountToWords(decimal amount)
    {
        var number = Math.Floor(amount);
        if (number == 0) return "Zero Rupees Only";

        string[] ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
        string[] tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

        static string ConvertPart(long n, string[] onesWords, string[] tensWords)
        {
            var result = string.Empty;
            if (n >= 100)
            {
                result += onesWords[n / 100] + " Hundred ";
                n %= 100;
            }
            if (n >= 20)
            {
                result += tensWords[n / 10] + " ";
                n %= 10;
            }
            if (n > 0)
            {
                result += onesWords[n] + " ";
            }
            return result;
        }

        var whole = (long)number;
        var crore = whole / 10000000;
        var lakh = (whole % 10000000) / 100000;
        var thousand = (whole % 100000) / 1000;
        var remainder = whole % 1000;

        var words = string.Empty;
        if (crore > 0) words += ConvertPart(crore, ones, tens) + "Crore ";
        if (lakh > 0) words += ConvertPart(lakh, ones, tens) + "Lakh ";
        if (thousand > 0) words += ConvertPart(thousand, ones, tens) + "Thousand ";
        if (remainder > 0) words += ConvertPart(remainder, ones, tens);

        var paisa = (int)Math.Round((amount - number) * 100, 0);
        words = words.Trim() + " Rupees";
        if (paisa > 0)
            words += " and " + ConvertPart(paisa, ones, tens).Trim() + " Paisa";

        return words.Trim() + " Only";
    }
}
