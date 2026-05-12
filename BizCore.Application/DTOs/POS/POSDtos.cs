using BizCore.Domain.Enums;

namespace BizCore.Application.DTOs.POS;

public record POSSessionDto(
    Guid Id, 
    Guid WarehouseId, 
    string WarehouseName, 
    Guid OpenedBy, 
    DateTime OpenedAt, 
    DateTime? ClosedAt, 
    decimal OpeningCash, 
    decimal? ClosingCash, 
    POSSessionStatus Status, 
    decimal TotalSales, 
    int TotalTransactions);

public record OpenSessionDto(Guid WarehouseId, decimal OpeningCash);
public record CloseSessionDto(decimal ClosingCash);

public record POSTransactionDto(
    Guid Id, 
    Guid SessionId, 
    string TransactionNumber, 
    Guid? CustomerId, 
    string? CustomerName, 
    PaymentMethod PaymentMethod, 
    decimal SubTotal, 
    decimal DiscountAmount, 
    decimal TaxAmount, 
    decimal TotalAmount, 
    decimal AmountPaid, 
    decimal Change, 
    POSTransactionStatus Status, 
    DateTime CompletedAt,
    List<POSTransactionItemDto> Items);

public record POSTransactionItemDto(
    Guid Id, 
    Guid ProductId, 
    string ProductName, 
    int Quantity, 
    decimal UnitPrice, 
    decimal DiscountPercent, 
    decimal Amount);

public record CreatePOSTransactionDto(
    Guid SessionId, 
    Guid? CustomerId, 
    PaymentMethod PaymentMethod, 
    decimal DiscountAmount, 
    decimal AmountPaid, 
    List<CreatePOSTransactionItemDto> Items);

public record CreatePOSTransactionItemDto(Guid ProductId, int Quantity, decimal UnitPrice, decimal DiscountPercent);

public record DailyPOSAnalyticsDto(decimal TotalSales, int TransactionCount, string TopSellingProduct);
public record POSProductDto(Guid Id, string Name, string SKU, decimal SellingPrice, int CurrentStock, string? Barcode);

// Hold Order DTOs
public record HoldOrderDto(
    Guid Id,
    string TransactionNumber,
    Guid? CustomerId,
    string? CustomerName,
    decimal TotalAmount,
    DateTime HeldAt,
    List<POSTransactionItemDto> Items);

public record ZReportDto(
    DateTime ReportDate,
    decimal TotalSales,
    int TransactionCount,
    decimal CashSales,
    decimal CardSales,
    decimal QRSales,
    decimal TotalDiscount,
    decimal TotalRefunds,
    int RefundCount,
    decimal OpeningCash,
    decimal ClosingCash);
