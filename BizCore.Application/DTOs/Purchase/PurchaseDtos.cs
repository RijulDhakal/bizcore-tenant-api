using BizCore.Domain.Enums;

namespace BizCore.Application.DTOs.Purchase;

public record SupplierDto(
    Guid Id,
    string SupplierCode,
    string CompanyName,
    SupplierType SupplierType,
    string ContactPerson,
    string? Designation,
    string PrimaryPhone,
    string? SecondaryPhone,
    string? Email,
    string? WhatsApp,
    string? PANNumber,
    string? VATNumber,
    string Address,
    string? City,
    string? District,
    PaymentType? PaymentTerms,
    decimal CreditLimit,
    decimal CurrentBalance,
    PaymentRecordMethod PaymentMethod,
    string? BankName,
    string? AccountNumber,
    string? BranchName,
    bool TDSApplicable,
    decimal TDSRate,
    VATCategory VATCategory,
    bool ExciseDutyApplicable,
    int Rating,
    string? Tags,
    string? Notes,
    bool IsActive,
    DateTime CreatedAt);

public record CreateSupplierDto(
    string CompanyName,
    SupplierType SupplierType,
    string ContactPerson,
    string? Designation,
    string PrimaryPhone,
    string? SecondaryPhone,
    string? Email,
    string? WhatsApp,
    string? PANNumber,
    string? VATNumber,
    string Address,
    string? City,
    string? District,
    PaymentType? PaymentTerms,
    decimal? CreditLimit,
    PaymentRecordMethod PaymentMethod,
    string? BankName,
    string? AccountNumber,
    string? BranchName,
    bool TDSApplicable,
    decimal? TDSRate,
    VATCategory VATCategory,
    bool ExciseDutyApplicable,
    int? Rating,
    string? Tags,
    string? Notes);

public record UpdateSupplierDto(
    string CompanyName,
    SupplierType SupplierType,
    string ContactPerson,
    string? Designation,
    string PrimaryPhone,
    string? SecondaryPhone,
    string? Email,
    string? WhatsApp,
    string? PANNumber,
    string? VATNumber,
    string Address,
    string? City,
    string? District,
    PaymentType? PaymentTerms,
    decimal? CreditLimit,
    PaymentRecordMethod PaymentMethod,
    string? BankName,
    string? AccountNumber,
    string? BranchName,
    bool TDSApplicable,
    decimal? TDSRate,
    VATCategory VATCategory,
    bool ExciseDutyApplicable,
    int? Rating,
    string? Tags,
    string? Notes,
    bool IsActive);

public record PurchaseOrderDto(
    Guid Id,
    string PONumber,
    Guid SupplierId,
    string SupplierName,
    string? SupplierPhone,
    string? SupplierPAN,
    PurchaseOrderStatus Status,
    DateTime OrderDate,
    DateTime? ExpectedDelivery,
    string? ReferenceNumber,
    Guid? DeliveryWarehouseId,
    string? DeliveryWarehouseName,
    string? DeliveryAddress,
    OrderType OrderType,
    Priority Priority,
    string? Department,
    Currency Currency,
    decimal? ExchangeRate,
    PaymentType? PaymentType,
    decimal? AdvanceAmount,
    DateTime? DueDate,
    decimal SubTotal,
    decimal TaxAmount,
    decimal? DiscountAmount,
    decimal? ShippingCost,
    decimal? ExciseDuty,
    decimal? TDSAmount,
    decimal TotalAmount,
    Guid? ApprovalLevel1By,
    string? ApprovalLevel1Name,
    DateTime? ApprovalLevel1Date,
    string? ApprovalLevel1Notes,
    Guid? ApprovalLevel2By,
    string? ApprovalLevel2Name,
    DateTime? ApprovalLevel2Date,
    string? ApprovalLevel2Notes,
    string? Attachments,
    string? Notes,
    DateTime CreatedAt,
    List<PurchaseOrderItemDto> Items,
    decimal PaidAmount,
    decimal PendingAmount);

public record PurchaseOrderItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string ProductSKU,
    string Description,
    int Quantity,
    string Unit,
    decimal UnitPrice,
    decimal TaxRate,
    decimal TaxAmount,
    decimal? DiscountPercent,
    decimal? DiscountAmount,
    decimal Amount,
    int QuantityReceived,
    decimal? UnitPriceLand,
    string? BatchNumber,
    DateTime? ExpiryDate);

public record CreatePurchaseOrderDto(
    Guid SupplierId,
    DateTime OrderDate,
    DateTime? ExpectedDelivery,
    string? ReferenceNumber,
    Guid? DeliveryWarehouseId,
    string? DeliveryAddress,
    OrderType OrderType,
    Priority Priority,
    string? Department,
    Currency Currency,
    PaymentType? PaymentType,
    PaymentTerms PaymentTerms,
    ShippingMethod ShippingMethod,
    DateTime? PromiseDate,
    string? SupplierReferenceNo,
    decimal? FreightCharges,
    decimal? AdvanceAmount,
    DateTime? DueDate,
    decimal? DiscountAmount,
    string? TermsAndConditions,
    string? Notes,
    List<CreatePurchaseOrderItemDto> Items);

public record CreatePurchaseOrderItemDto(
    Guid ProductId,
    string Description,
    int Quantity,
    string Unit,
    decimal UnitPrice,
    decimal? TaxRate,
    decimal? DiscountPercent,
    decimal? UnitPriceLand,
    string? BatchNumber,
    DateTime? ExpiryDate);

public record GoodsReceiptDto(
    Guid Id,
    Guid PurchaseOrderId,
    string PONumber,
    string SupplierName,
    string ReceiptNumber,
    DateTime ReceivedDate,
    Guid ReceivedBy,
    string ReceivedByName,
    Guid WarehouseId,
    string WarehouseName,
    GoodsReceiptStatus Status,
    GoodsReceiptCondition Condition,
    string? DamageDetails,
    string? Attachments,
    string? Notes,
    DateTime CreatedAt,
    List<GoodsReceiptItemDto> Items);

public record GoodsReceiptItemDto(
    Guid Id,
    Guid PurchaseOrderItemId,
    Guid ProductId,
    string ProductName,
    int QuantityOrdered,
    int QuantityReceived,
    int QuantityDamaged,
    string? BatchNumber,
    DateTime? ExpiryDate,
    string? Notes);

public record CreateGoodsReceiptDto(
    Guid PurchaseOrderId,
    DateTime ReceivedDate,
    Guid WarehouseId,
    GoodsReceiptCondition Condition,
    string? DamageDetails,
    string? Notes,
    List<CreateGoodsReceiptItemDto> Items);

public record CreateGoodsReceiptItemDto(
    Guid PurchaseOrderItemId,
    int QuantityReceived,
    int QuantityDamaged,
    string? BatchNumber,
    DateTime? ExpiryDate,
    string? Notes);

public record PaymentDto(
    Guid Id,
    string PaymentNumber,
    Guid PurchaseOrderId,
    string PONumber,
    string SupplierName,
    DateTime PaymentDate,
    decimal Amount,
    PaymentRecordMethod PaymentMethod,
    string? ReferenceNumber,
    Guid? BankAccountId,
    string? BankAccountName,
    decimal? TDSDeducted,
    string? TDSCertificateNo,
    DateTime? TDSCertificateDate,
    PaymentStatus Status,
    string? Notes,
    DateTime CreatedAt);

public record CreatePaymentDto(
    Guid PurchaseOrderId,
    DateTime PaymentDate,
    decimal Amount,
    PaymentRecordMethod PaymentMethod,
    string? ReferenceNumber,
    Guid? BankAccountId,
    decimal? TDSDeducted,
    string? TDSCertificateNo,
    DateTime? TDSCertificateDate,
    string? Notes);

public record PurchaseReturnDto(
    Guid Id,
    Guid PurchaseOrderId,
    string PONumber,
    string SupplierName,
    Guid? GoodsReceiptId,
    string ReturnNumber,
    DateTime ReturnDate,
    ReturnType ReturnType,
    decimal TotalAmount,
    PurchaseReturnStatus Status,
    RefundType RefundType,
    string Reason,
    string? ApprovedByName,
    DateTime? ApprovedDate,
    string? Notes,
    DateTime CreatedAt,
    List<PurchaseReturnItemDto> Items);

public record PurchaseReturnItemDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Amount,
    string Reason,
    ReturnCondition Condition,
    Resolution Resolution);

public record CreatePurchaseReturnDto(
    Guid PurchaseOrderId,
    Guid? GoodsReceiptId,
    DateTime ReturnDate,
    ReturnType ReturnType,
    RefundType RefundType,
    string Reason,
    string? Notes,
    List<CreatePurchaseReturnItemDto> Items);

public record CreatePurchaseReturnItemDto(
    Guid ProductId,
    int Quantity,
    decimal UnitPrice,
    string Reason,
    ReturnCondition Condition,
    Resolution Resolution);

public record PurchaseAnalyticsDto(
    decimal TotalSpend,
    int OrderCount,
    string TopSupplierName,
    decimal PendingApprovals,
    decimal PendingDeliveries);

public record PurchaseSummaryReportDto(
    DateTime FromDate,
    DateTime ToDate,
    int TotalOrders,
    decimal TotalAmount,
    decimal TotalTax,
    decimal TotalTDS,
    decimal AverageOrderValue,
    List<SupplierPurchaseSummary> BySupplier,
    List<MonthlyPurchaseTrend> MonthlyTrend);

public record SupplierPurchaseSummary(
    Guid SupplierId,
    string SupplierName,
    int OrderCount,
    decimal TotalAmount,
    decimal Percentage);

public record MonthlyPurchaseTrend(
    int Year,
    int Month,
    decimal Amount,
    int OrderCount);

public record SupplierLedgerDto(
    Guid SupplierId,
    string SupplierName,
    string? PANNumber,
    decimal OpeningBalance,
    decimal Purchases,
    decimal Payments,
    decimal Returns,
    decimal ClosingBalance,
    List<SupplierLedgerEntry> Entries);

public record SupplierLedgerEntry(
    DateTime Date,
    string Reference,
    string Type,
    decimal Debit,
    decimal Credit,
    decimal Balance);

public record TaxReportDto(
    DateTime FromDate,
    DateTime ToDate,
    decimal TotalPurchases,
    decimal VATInput,
    decimal TDSDeducted,
    List<TaxEntry> Entries);

public record TaxEntry(
    DateTime Date,
    string Reference,
    string SupplierName,
    decimal Amount,
    decimal VAT,
    decimal TDS);