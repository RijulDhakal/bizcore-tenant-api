using BizCore.Domain.Enums;
using BizCore.Domain.Entities;

namespace BizCore.Application.DTOs.Inventory;

public record CategoryDto(Guid Id, string Name, string? Description, int ProductCount, Guid? ParentCategoryId = null, List<CategoryDto>? SubCategories = null);
public record CreateCategoryDto(string Name, string? Description, Guid? ParentCategoryId = null);

public record ProductDto(
    Guid Id,
    string Name,
    string SKU,
    string? Description,
    Guid? CategoryId,
    string? CategoryName,
    decimal CostPrice,
    decimal SellingPrice,
    bool IsVatApplicable,
    string? Brand,
    int ReorderQuantity,
    bool TrackExpiry,
    string? HSNCode,
    int LowStockThreshold,
    string Unit,
    string? Barcode,
    bool IsActive,
    int CurrentStock,
    string? BatchNumber,
    int? BatchId);

public record WarehouseStockEntry(
    Guid WarehouseId,
    int OpeningStock,
    string? BatchNumber,
    DateTime? ExpiryDate,
    DateTime? ManufactureDate);

public record CreateProductDto(
    string Name,
    string? SKU,
    string? Description,
    Guid? CategoryId,
    decimal CostPrice,
    decimal SellingPrice,
    bool IsVatApplicable,
    string? Brand,
    int ReorderQuantity,
    bool TrackExpiry,
    string? HSNCode,
    int LowStockThreshold,
    string Unit,
    string? Barcode,
    bool IsActive,
    List<WarehouseStockEntry>? WarehouseStocks);

public record UpdateProductDto(
    string Name, 
    string? Description, 
    Guid? CategoryId, 
    decimal CostPrice, 
    decimal SellingPrice, 
    bool IsVatApplicable,
    string? Brand,
    int ReorderQuantity,
    bool TrackExpiry,
    string? HSNCode,
    int LowStockThreshold, 
    string Unit, 
    string? Barcode,
    bool IsActive);

public record WarehouseDto(
    Guid Id,
    string Name,
    string? Code,
    string? Location,
    string? Address,
    string? City,
    string? District,
    string? ContactPerson,
    string? ContactPhone,
    int Type,
    int Status,
    bool AllowNegativeStock,
    bool IsDefault,
    bool IsActive);

public record CreateWarehouseDto(
    string Name,
    string? Code,
    string? Location,
    string? Address,
    string? City,
    string? District,
    string? ContactPerson,
    string? ContactPhone,
    int Type,
    int Status,
    bool AllowNegativeStock,
    bool IsDefault,
    bool IsActive);

public record WarehouseStockDto(
    Guid Id,
    Guid WarehouseId,
    string WarehouseName,
    Guid ProductId,
    string ProductName,
    int CurrentStock,
    int ReservedStock,
    DateTime UpdatedAt);

public record StockMovementDto(
    Guid Id, 
    Guid ProductId, 
    string ProductName, 
    Guid WarehouseId, 
    string WarehouseName, 
    StockMovementType Type, 
    int Quantity, 
    string? ReferenceType, 
    Guid? ReferenceId, 
    string? Note, 
    DateTime MovedAt);

public record AdjustStockDto(Guid ProductId, Guid WarehouseId, StockMovementType Type, int Quantity, string? Note);
public record TransferStockDto(Guid ProductId, Guid SourceWarehouseId, Guid DestinationWarehouseId, int Quantity, string? Note);

public record InventorySummaryDto(decimal TotalStockValue, int ProductCount, int LowStockCount);

public record BatchDto(
    Guid Id,
    Guid ProductId,
    string ProductName,
    string BatchNumber,
    DateTime? ManufactureDate,
    DateTime? ExpiryDate,
    int InitialQuantity,
    int CurrentQuantity,
    decimal UnitCost,
    string? Location,
    BatchStatus Status,
    string? Notes,
    DateTime CreatedAt,
    int? RecommendedQuantity = null,
    bool? IsFirstExpiry = null);

public record CreateBatchDto(
    Guid ProductId,
    Guid WarehouseId,
    string BatchNumber,
    DateTime? ManufactureDate,
    DateTime? ExpiryDate,
    int InitialQuantity,
    decimal UnitCost,
    string? Location,
    string? Notes);

public record UpdateBatchDto(
    string? BatchNumber,
    DateTime? ManufactureDate,
    DateTime? ExpiryDate,
    string? Location,
    string? Notes,
    BatchStatus? Status);

public record StockTransferDto(
    Guid Id,
    Guid FromWarehouseId,
    string FromWarehouseName,
    Guid ToWarehouseId,
    string ToWarehouseName,
    Guid ProductId,
    string ProductName,
    Guid? BatchId,
    string? BatchNumber,
    int Quantity,
    TransferStatus Status,
    string? Notes,
    Guid? ApprovedBy,
    DateTime? ApprovedAt,
    DateTime TransferredAt,
    TransferType Type,
    TransferPriority Priority,
    DateTime? ExpectedDeliveryDate,
    TransferReason? Reason,
    decimal? ShippingCost,
    string? TrackingNumber,
    bool RequiresApproval);

public record CreateStockTransferDto(
    Guid FromWarehouseId,
    Guid ToWarehouseId,
    Guid ProductId,
    Guid? BatchId,
    int Quantity,
    string? Notes,
    TransferType Type,
    TransferPriority Priority,
    DateTime? ExpectedDeliveryDate,
    TransferReason? Reason,
    decimal? ShippingCost,
    string? TrackingNumber,
    bool RequiresApproval);

public record ProductStockDto(
    Guid ProductId,
    string ProductName,
    Guid WarehouseId,
    string WarehouseName,
    int QuantityInStock,
    int ReservedQuantity,
    int AvailableQuantity);

public record ProductWarehouseDto(
    Guid ProductId,
    string ProductName,
    string SKU,
    int TotalStock,
    string Unit,
    bool TrackExpiry,
    string? BatchNumber,
    Guid? BatchId,
    int BatchCurrentQuantity,
    List<ProductStockDto> StockByWarehouse);

public record ExpiryAlertDto(
    Guid BatchId,
    string BatchNumber,
    string ProductName,
    int DaysUntilExpiry,
    string Severity,
    string Message,
    string Action);
