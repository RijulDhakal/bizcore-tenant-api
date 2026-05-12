using BizCore.Application.DTOs.POS;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.EntityFrameworkCore;
using QuestPDF;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BizCore.Infrastructure.Application.Services;

public class POSService : IPOSService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IInventoryService _inventoryService;

    public POSService(AppDbContext context, ITenantService tenantService, ICurrentUserService currentUserService, IInventoryService inventoryService)
    {
        _context = context;
        _tenantService = tenantService;
        _currentUserService = currentUserService;
        _inventoryService = inventoryService;
    }

    public async Task<ApiResponse<POSSessionDto>> OpenSessionAsync(OpenSessionDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        if (tenantId == Guid.Empty)
            return ApiResponse<POSSessionDto>.FailResult("Invalid tenant context");
        
        if (await _context.POSSessions.AnyAsync(s => s.TenantId == tenantId && s.Status == POSSessionStatus.Open))
            return ApiResponse<POSSessionDto>.FailResult("A session is already open for this tenant");
 
        var session = new POSSession
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            WarehouseId = dto.WarehouseId,
            OpenedBy = _currentUserService.UserId,
            OpenedAt = DateTime.UtcNow,
            OpeningCash = dto.OpeningCash,
            Status = POSSessionStatus.Open,
            TotalSales = 0,
            TotalTransactions = 0
        };

        _context.POSSessions.Add(session);
        await _context.SaveChangesAsync();

        return await GetSessionSummaryAsync(session.Id);
    }

    public async Task<ApiResponse<bool>> CloseSessionAsync(Guid id, CloseSessionDto dto)
    {
        var session = await _context.POSSessions.FindAsync(id);
        if (session == null) return ApiResponse<bool>.FailResult("Session not found");
        if (session.Status == POSSessionStatus.Closed) return ApiResponse<bool>.FailResult("Session already closed");

        session.ClosingCash = dto.ClosingCash;
        session.ClosedAt = DateTime.UtcNow;
        session.Status = POSSessionStatus.Closed;

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<POSSessionDto>> GetCurrentSessionAsync()
    {
        var session = await _context.POSSessions
            .Include(s => s.Warehouse)
            .Where(s => !s.IsDeleted && s.Status == POSSessionStatus.Open)
            .OrderByDescending(s => s.OpenedAt)
            .FirstOrDefaultAsync();

        Console.WriteLine($"[POS] Found session: {session?.Id}, TenantId: {session?.TenantId}");

        if (session == null) return ApiResponse<POSSessionDto>.FailResult("No open session found");

        return ApiResponse<POSSessionDto>.SuccessResult(MapToDto(session));
    }

    public async Task<ApiResponse<POSSessionDto>> GetSessionSummaryAsync(Guid id)
    {
        var session = await _context.POSSessions.Include(s => s.Warehouse).FirstOrDefaultAsync(s => s.Id == id);
        if (session == null) return ApiResponse<POSSessionDto>.FailResult("Session not found");

        return ApiResponse<POSSessionDto>.SuccessResult(MapToDto(session));
    }

    public async Task<ApiResponse<POSTransactionDto>> CreateTransactionAsync(CreatePOSTransactionDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        if (tenantId == Guid.Empty)
        {
            tenantId = await _context.Users
                .Where(u => !u.IsDeleted && u.CurrentTenantId != Guid.Empty)
                .Select(u => u.CurrentTenantId)
                .FirstOrDefaultAsync() ?? Guid.Empty;
            Console.WriteLine($"[POS] Fallback TenantId: {tenantId}");
        }
        
        if (tenantId == Guid.Empty)
            return ApiResponse<POSTransactionDto>.FailResult("Invalid tenant context");

        var session = await _context.POSSessions
            .FirstOrDefaultAsync(s => s.Id == dto.SessionId && s.TenantId == tenantId && !s.IsDeleted);
        if (session == null || session.Status == POSSessionStatus.Closed)
            return ApiResponse<POSTransactionDto>.FailResult("Invalid session");

        var dateStr = DateTime.UtcNow.ToString("yyyyMMdd");
        var count = await _context.POSTransactions.IgnoreQueryFilters()
            .CountAsync(t => t.TenantId == tenantId && t.TransactionNumber.Contains(dateStr)) + 1;
        
        var txnNumber = $"TXN-{dateStr}-{count:D4}";

        var subTotal = dto.Items.Sum(i => i.Quantity * i.UnitPrice);
        var taxAmount = subTotal * 0.13m;
        var totalAmount = (subTotal + taxAmount) - dto.DiscountAmount;

        var txn = new POSTransaction
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SessionId = dto.SessionId,
            TransactionNumber = txnNumber,
            CustomerId = dto.CustomerId,
            PaymentMethod = dto.PaymentMethod,
            SubTotal = subTotal,
            DiscountAmount = dto.DiscountAmount,
            TaxAmount = taxAmount,
            TotalAmount = totalAmount,
            AmountPaid = dto.AmountPaid,
            Change = dto.AmountPaid - totalAmount,
            Status = POSTransactionStatus.Completed,
            CompletedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new POSTransactionItem
            {
                ProductId = i.ProductId,
                ProductName = _context.Products.Find(i.ProductId)?.Name ?? "Product",
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                DiscountPercent = i.DiscountPercent,
                Amount = (i.Quantity * i.UnitPrice) * (1 - i.DiscountPercent / 100)
            }).ToList()
        };

        foreach (var item in txn.Items)
        {
            var deductResult = await _inventoryService.DeductStockAsync(new DeductStockDto
            {
                ProductId = item.ProductId,
                WarehouseId = session.WarehouseId,
                Quantity = item.Quantity,
                ReferenceType = "POS_SALE",
                ReferenceId = txn.Id
            });

            if (!deductResult.Success)
                return ApiResponse<POSTransactionDto>.FailResult($"Stock deduction failed for {item.ProductName}: {deductResult.Message}");
        }

        _context.POSTransactions.Add(txn);
        await _context.SaveChangesAsync();
        Console.WriteLine($"[POS] Transaction saved: {txn.Id}");

        var sessionToUpdate = await _context.POSSessions
            .Where(s => s.Id == txn.SessionId && s.TenantId == tenantId && !s.IsDeleted)
            .FirstOrDefaultAsync();

        if (sessionToUpdate != null)
        {
            sessionToUpdate.TotalSales += txn.TotalAmount;
            sessionToUpdate.TotalTransactions += 1;
            sessionToUpdate.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        try
        {
            if (txn.PaymentMethod == PaymentMethod.Credit && txn.CustomerId != Guid.Empty)
            {
                await CreateKhataEntryAsync(txn);
            }
            
            await CreateLinkedBankTransactionAsync(txn);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[POS→CashBook/Khata] Error: {ex.Message}");
        }

        return await GetTransactionByIdAsync(txn.Id);
    }

    public async Task<ApiResponse<List<POSTransactionDto>>> GetTransactionsAsync(Guid? sessionId, DateTime? dateFrom, DateTime? dateTo)
    {
        var query = _context.POSTransactions.Include(t => t.Customer).AsQueryable();

        if (sessionId.HasValue) query = query.Where(t => t.SessionId == sessionId);
        if (dateFrom.HasValue) query = query.Where(t => t.CompletedAt >= dateFrom);
        if (dateTo.HasValue) query = query.Where(t => t.CompletedAt <= dateTo);

        var txns = await query
            .OrderByDescending(t => t.CompletedAt)
            .Select(t => new POSTransactionDto(
                t.Id, t.SessionId, t.TransactionNumber, t.CustomerId, 
                t.Customer != null ? t.Customer.Name : "Walk-in",
                t.PaymentMethod, t.SubTotal, t.DiscountAmount, t.TaxAmount, t.TotalAmount, 
                t.AmountPaid, t.Change, t.Status, t.CompletedAt,
                t.Items.Select(i => new POSTransactionItemDto(i.Id, i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, i.DiscountPercent, i.Amount)).ToList()
            )).ToListAsync();

        return ApiResponse<List<POSTransactionDto>>.SuccessResult(txns);
    }

    public async Task<ApiResponse<POSTransactionDto>> GetTransactionByIdAsync(Guid id)
    {
        var t = await _context.POSTransactions
            .Include(t => t.Customer)
            .Include(t => t.Items)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (t == null) return ApiResponse<POSTransactionDto>.FailResult("Transaction not found");

        var dto = new POSTransactionDto(
            t.Id, t.SessionId, t.TransactionNumber, t.CustomerId, 
            t.Customer != null ? t.Customer.Name : "Walk-in",
            t.PaymentMethod, t.SubTotal, t.DiscountAmount, t.TaxAmount, t.TotalAmount, 
            t.AmountPaid, t.Change, t.Status, t.CompletedAt,
            t.Items.Select(i => new POSTransactionItemDto(i.Id, i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, i.DiscountPercent, i.Amount)).ToList()
        );

        return ApiResponse<POSTransactionDto>.SuccessResult(dto);
    }

    public async Task<ApiResponse<bool>> RefundTransactionAsync(Guid id)
    {
        var txn = await _context.POSTransactions.Include(t => t.Items).Include(t => t.Session).FirstOrDefaultAsync(t => t.Id == id);
        if (txn == null) return ApiResponse<bool>.FailResult("Transaction not found");
        if (txn.Status == POSTransactionStatus.Refunded) return ApiResponse<bool>.FailResult("Already refunded");

        var tenantId = _tenantService.GetTenantId();
        if (tenantId == Guid.Empty)
            return ApiResponse<bool>.FailResult("Invalid tenant context");
        foreach (var item in txn.Items)
        {
            var warehouseStock = await _context.WarehouseStocks
                .FirstOrDefaultAsync(ws => ws.WarehouseId == txn.Session.WarehouseId && ws.ProductId == item.ProductId);

            if (warehouseStock != null)
            {
                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    ProductId = item.ProductId,
                    WarehouseId = txn.Session.WarehouseId,
                    Type = StockMovementType.StockIn,
                    Quantity = item.Quantity,
                    Note = $"POS Refund: {txn.TransactionNumber}",
                    ReferenceType = "POSTransaction",
                    ReferenceId = txn.Id,
                    MovedAt = DateTime.UtcNow
                };
                _context.StockMovements.Add(movement);
                warehouseStock.CurrentStock += item.Quantity;
                warehouseStock.UpdatedAt = DateTime.UtcNow;
            }
        }

        txn.Status = POSTransactionStatus.Refunded;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<List<POSProductDto>>> GetPOSProductsAsync()
    {
        var products = await _context.Products
            .Where(p => p.IsActive)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.SKU,
                p.SellingPrice,
                p.Barcode,
                CurrentStock = _context.WarehouseStocks.Where(ws => ws.ProductId == p.Id).Sum(ws => ws.CurrentStock)
            })
            .ToListAsync();

        var result = products.Select(p => new POSProductDto(p.Id, p.Name, p.SKU, p.SellingPrice, p.CurrentStock, p.Barcode)).ToList();
        return ApiResponse<List<POSProductDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<List<POSProductDto>>> SearchPOSProductsAsync(string q)
    {
        var products = await _context.Products
            .Where(p => p.IsActive && (p.Name.Contains(q) || p.SKU.Contains(q) || (p.Barcode != null && p.Barcode.Contains(q))))
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.SKU,
                p.SellingPrice,
                p.Barcode,
                CurrentStock = _context.WarehouseStocks.Where(ws => ws.ProductId == p.Id).Sum(ws => ws.CurrentStock)
            })
            .ToListAsync();

        var result = products.Select(p => new POSProductDto(p.Id, p.Name, p.SKU, p.SellingPrice, p.CurrentStock, p.Barcode)).ToList();
        return ApiResponse<List<POSProductDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<DailyPOSAnalyticsDto>> GetDailyAnalyticsAsync(DateTime date)
    {
        var start = date.Date;
        var end = start.AddDays(1);

        var totalSales = await _context.POSTransactions
            .Where(t => t.CompletedAt >= start && t.CompletedAt < end && t.Status == POSTransactionStatus.Completed)
            .SumAsync(t => t.TotalAmount);

        var txnCount = await _context.POSTransactions
            .CountAsync(t => t.CompletedAt >= start && t.CompletedAt < end);

        var topProduct = await _context.POSTransactionItems
            .Include(ti => ti.Transaction)
            .Where(ti => ti.Transaction.CompletedAt >= start && ti.Transaction.CompletedAt < end)
            .GroupBy(ti => ti.ProductName)
            .OrderByDescending(g => g.Sum(ti => ti.Quantity))
            .Select(g => g.Key)
            .FirstOrDefaultAsync() ?? "None";

        return ApiResponse<DailyPOSAnalyticsDto>.SuccessResult(new DailyPOSAnalyticsDto(totalSales, txnCount, topProduct));
    }

    public async Task<ApiResponse<DailyPOSAnalyticsDto>> GetSummaryAnalyticsAsync(DateTime dateFrom, DateTime dateTo)
    {
        var totalSales = await _context.POSTransactions
            .Where(t => t.CompletedAt >= dateFrom && t.CompletedAt <= dateTo && t.Status == POSTransactionStatus.Completed)
            .SumAsync(t => t.TotalAmount);

        var txnCount = await _context.POSTransactions
            .CountAsync(t => t.CompletedAt >= dateFrom && t.CompletedAt <= dateTo);

        var topProduct = await _context.POSTransactionItems
            .Include(ti => ti.Transaction)
            .Where(ti => ti.Transaction.CompletedAt >= dateFrom && ti.Transaction.CompletedAt <= dateTo)
            .GroupBy(ti => ti.ProductName)
            .OrderByDescending(g => g.Sum(ti => ti.Quantity))
            .Select(g => g.Key)
            .FirstOrDefaultAsync() ?? "None";

        return ApiResponse<DailyPOSAnalyticsDto>.SuccessResult(new DailyPOSAnalyticsDto(totalSales, txnCount, topProduct));
    }

    private async Task CreateLinkedBankTransactionAsync(POSTransaction transaction)
    {
        Console.WriteLine($"[POS→CashBook] Creating link: amount={transaction.TotalAmount}");

        var tenantId = transaction.TenantId;

        var account = await _context.BankAccounts
            .Where(a => a.TenantId == tenantId && !a.IsDeleted && a.AccountType == "Cash")
            .FirstOrDefaultAsync()
            ?? await _context.BankAccounts
                .Where(a => a.TenantId == tenantId && !a.IsDeleted && a.IsDefault)
                .FirstOrDefaultAsync()
            ?? await _context.BankAccounts
                .Where(a => a.TenantId == tenantId && !a.IsDeleted)
                .FirstOrDefaultAsync();

        if (account == null)
        {
            Console.WriteLine("[POS→CashBook] No account found.");
            return;
        }

        account.CurrentBalance += transaction.TotalAmount;
        account.UpdatedAt = DateTime.UtcNow;

        var bankTxn = new BankTransaction
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            AccountId = account.Id,
            Type = "Deposit",
            Amount = transaction.TotalAmount,
            BalanceAfter = account.CurrentBalance,
            TransactionDate = transaction.CompletedAt,
            Description = $"POS Sale: {transaction.TransactionNumber}",
            Payee = "Walk-in Customer",
            Category = "Sales",
            LinkedModule = "POS",
            LinkedId = transaction.Id,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };

        _context.BankTransactions.Add(bankTxn);
        await _context.SaveChangesAsync();

        Console.WriteLine($"[POS→CashBook] Linked: NPR {transaction.TotalAmount} to {account.AccountName}. Balance: {account.CurrentBalance}");
    }

    private async Task CreateKhataEntryAsync(POSTransaction transaction)
    {
        var tenantId = transaction.TenantId;
        var customer = await _context.Contacts.FindAsync(transaction.CustomerId);
        if (customer == null) return;

        var khataEntry = new KhataEntry
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            PartyId = customer.Id,
            Type = EntryType.Debit,
            TransactionType = "POS Sale",
            Amount = transaction.TotalAmount,
            Note = $"POS: {transaction.TransactionNumber}",
            Date = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.KhataEntries.Add(khataEntry);
        await _context.SaveChangesAsync();

        Console.WriteLine($"[POS→Khata] Created Debit entry: NPR {transaction.TotalAmount} for {customer.Name}");
    }

    private POSSessionDto MapToDto(POSSession s)
    {
        return new POSSessionDto(
            s.Id, s.WarehouseId, s.Warehouse.Name, s.OpenedBy, s.OpenedAt, s.ClosedAt,
            s.OpeningCash, s.ClosingCash, s.Status, s.TotalSales, s.TotalTransactions);
    }

    public async Task<ApiResponse<bool>> HoldOrderAsync(CreatePOSTransactionDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var session = await _context.POSSessions.FirstOrDefaultAsync(s => s.TenantId == tenantId && s.Status == POSSessionStatus.Open);
        if (session == null)
            return ApiResponse<bool>.FailResult("No open POS session");

        var transactionNumber = $"POS-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4]}";
        var subTotal = dto.Items.Sum(i => i.Quantity * i.UnitPrice);
        var taxAmount = subTotal * 0.13m;
        var totalAmount = subTotal + taxAmount - dto.DiscountAmount;

        var transaction = new POSTransaction
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            SessionId = session.Id,
            TransactionNumber = transactionNumber,
            CustomerId = dto.CustomerId,
            PaymentMethod = dto.PaymentMethod,
            SubTotal = subTotal,
            DiscountAmount = dto.DiscountAmount,
            TaxAmount = taxAmount,
            TotalAmount = totalAmount,
            AmountPaid = 0,
            Change = 0,
            Status = POSTransactionStatus.Held,
            CompletedAt = DateTime.UtcNow
        };

        _context.POSTransactions.Add(transaction);

        var items = dto.Items.Select(i => new POSTransactionItem
        {
            Id = Guid.NewGuid(),
            TransactionId = transaction.Id,
            ProductId = i.ProductId,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            DiscountPercent = i.DiscountPercent,
            Amount = i.Quantity * i.UnitPrice * (1 - i.DiscountPercent / 100)
        }).ToList();

        _context.POSTransactionItems.AddRange(items);
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true, "Order held successfully");
    }

    public async Task<ApiResponse<List<POSTransactionDto>>> GetHeldOrdersAsync()
    {
        var tenantId = _tenantService.GetTenantId();
        var heldOrders = await _context.POSTransactions
            .Where(t => t.TenantId == tenantId && t.Status == POSTransactionStatus.Held)
            .Include(t => t.Items)
            .OrderByDescending(t => t.CompletedAt)
            .ToListAsync();

        var dtos = heldOrders.Select(t => new POSTransactionDto(
            t.Id, t.SessionId, t.TransactionNumber, t.CustomerId, null,
            t.PaymentMethod, t.SubTotal, t.DiscountAmount, t.TaxAmount,
            t.TotalAmount, t.AmountPaid, t.Change, t.Status, t.CompletedAt,
            t.Items.Select(i => new POSTransactionItemDto(i.Id, i.ProductId, "", i.Quantity, i.UnitPrice, i.DiscountPercent, i.Amount)).ToList()
        )).ToList();

        return ApiResponse<List<POSTransactionDto>>.SuccessResult(dtos);
    }

    public async Task<ApiResponse<POSTransactionDto>> RecallHeldOrderAsync(Guid id)
    {
        var tenantId = _tenantService.GetTenantId();
        var heldOrder = await _context.POSTransactions
            .Where(t => t.Id == id && t.TenantId == tenantId && t.Status == POSTransactionStatus.Held)
            .Include(t => t.Items)
            .FirstOrDefaultAsync();

        if (heldOrder == null)
            return ApiResponse<POSTransactionDto>.FailResult("Held order not found");

        var session = await _context.POSSessions.FirstOrDefaultAsync(s => s.Id == heldOrder.SessionId && s.Status == POSSessionStatus.Open);
        if (session == null)
            return ApiResponse<POSTransactionDto>.FailResult("Session not found");

        heldOrder.Status = POSTransactionStatus.Completed;
        session.TotalSales += heldOrder.TotalAmount;
        session.TotalTransactions += 1;

        await _context.SaveChangesAsync();

        return ApiResponse<POSTransactionDto>.SuccessResult(new POSTransactionDto(
            heldOrder.Id, heldOrder.SessionId, heldOrder.TransactionNumber, heldOrder.CustomerId, null,
            heldOrder.PaymentMethod, heldOrder.SubTotal, heldOrder.DiscountAmount, heldOrder.TaxAmount,
            heldOrder.TotalAmount, heldOrder.AmountPaid, heldOrder.Change, heldOrder.Status, heldOrder.CompletedAt,
            heldOrder.Items.Select(i => new POSTransactionItemDto(i.Id, i.ProductId, "", i.Quantity, i.UnitPrice, i.DiscountPercent, i.Amount)).ToList()
        ));
    }

    public async Task<ApiResponse<byte[]>> GenerateZReportAsync(DateTime date)
    {
        var tenantId = _tenantService.GetTenantId();
        var dayStart = date.Date;
        var dayEnd = dayStart.AddDays(1);

        var session = await _context.POSSessions
            .Where(s => s.TenantId == tenantId && s.OpenedAt >= dayStart && s.OpenedAt < dayEnd)
            .FirstOrDefaultAsync();

        if (session == null)
            return ApiResponse<byte[]>.FailResult("No session found for this date");

        var transactions = await _context.POSTransactions
            .Where(t => t.SessionId == session.Id && t.Status == POSTransactionStatus.Completed)
            .ToListAsync();

        var refunds = await _context.POSTransactions
            .Where(t => t.SessionId == session.Id && t.Status == POSTransactionStatus.Refunded)
            .ToListAsync();

        var cashSales = transactions.Where(t => t.PaymentMethod == PaymentMethod.Cash).Sum(t => t.TotalAmount);
        var cardSales = transactions.Where(t => t.PaymentMethod == PaymentMethod.Card).Sum(t => t.TotalAmount);
        var qrSales = transactions.Where(t => t.PaymentMethod == PaymentMethod.QR).Sum(t => t.TotalAmount);

        var report = new ZReportDto(
            date, transactions.Sum(t => t.TotalAmount), transactions.Count,
            cashSales, cardSales, qrSales,
            transactions.Sum(t => t.DiscountAmount),
            refunds.Sum(t => t.TotalAmount), refunds.Count,
            session.OpeningCash, session.ClosingCash ?? 0);

        QuestPDF.Settings.License = LicenseType.Community;

        var pdfDocument = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A5);
                page.Margin(20);
                page.DefaultTextStyle(x => x.FontSize(10));

                page.Header().Element(c => c.Text("Z-Report").Bold().FontSize(14).AlignCenter());
                page.Content().Column(col =>
                {
                    col.Item().Text($"Date: {date:yyyy-MM-dd}");
                    col.Item().Text($"Session: {session.Id}");
                    col.Item().LineHorizontal(1);
                    col.Item().Text($"Total Sales: NPR {report.TotalSales:N2}");
                    col.Item().Text($"Transactions: {report.TransactionCount}");
                    col.Item().LineHorizontal(1);
                    col.Item().Text($"Cash: NPR {report.CashSales:N2}");
                    col.Item().Text($"Card: NPR {report.CardSales:N2}");
                    col.Item().Text($"QR: NPR {report.QRSales:N2}");
                    col.Item().LineHorizontal(1);
                    col.Item().Text($"Total Discount: NPR {report.TotalDiscount:N2}");
                    col.Item().Text($"Refunds: NPR {report.TotalRefunds:N2} ({report.RefundCount})");
                    col.Item().LineHorizontal(1);
                    col.Item().Text($"Opening Cash: NPR {report.OpeningCash:N2}");
                    col.Item().Text($"Closing Cash: NPR {report.ClosingCash:N2}");
                });
                page.Footer().Text($"{DateTime.UtcNow:yyyy-MM-dd HH:mm}").AlignCenter();
            });
        });

        var pdfBytes = pdfDocument.GeneratePdf();
        return ApiResponse<byte[]>.SuccessResult(pdfBytes);
    }
}
