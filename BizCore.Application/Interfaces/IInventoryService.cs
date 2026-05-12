using BizCore.Application.DTOs.Inventory;
using BizCore.Domain.Entities;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IInventoryService
{
    // Categories
    Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync();
    Task<ApiResponse<CategoryDto>> CreateCategoryAsync(CreateCategoryDto dto);
    Task<ApiResponse<bool>> UpdateCategoryAsync(Guid id, CreateCategoryDto dto);
    Task<ApiResponse<bool>> DeleteCategoryAsync(Guid id, Guid? targetCategoryId = null);

    // Products
    Task<ApiResponse<List<ProductDto>>> GetProductsAsync(string? search, Guid? categoryId, bool lowStockOnly);
    Task<ApiResponse<ProductDto>> GetProductByIdAsync(Guid id);
    Task<ApiResponse<ProductDto>> CreateProductAsync(CreateProductDto dto);
    Task<ApiResponse<bool>> UpdateProductAsync(Guid id, UpdateProductDto dto);
    Task<ApiResponse<bool>> DeleteProductAsync(Guid id);
    Task<ApiResponse<List<ProductDto>>> GetLowStockProductsAsync();

    // Warehouses
    Task<ApiResponse<List<WarehouseDto>>> GetWarehousesAsync();
    Task<ApiResponse<WarehouseDto>> CreateWarehouseAsync(CreateWarehouseDto dto);
    Task<ApiResponse<bool>> UpdateWarehouseAsync(Guid id, CreateWarehouseDto dto);
    Task<ApiResponse<Warehouse>> EnsureDefaultWarehouseAsync(Guid tenantId);

    // Stock Movements
    Task<ApiResponse<bool>> AdjustStockAsync(AdjustStockDto dto);
    Task<ApiResponse<bool>> TransferStockAsync(TransferStockDto dto);
    Task<ApiResponse<List<StockMovementDto>>> GetStockMovementsAsync(Guid? productId, Guid? warehouseId, DateTime? dateFrom, DateTime? dateTo);
    Task<ApiResponse<InventorySummaryDto>> GetInventorySummaryAsync();

    Task<ApiResponse<List<BatchDto>>> GetBatchesAsync(Guid? productId);
    Task<ApiResponse<BatchDto>> CreateBatchAsync(CreateBatchDto dto);
    Task<ApiResponse<BatchDto>> UpdateBatchAsync(Guid id, UpdateBatchDto dto);
    Task<ApiResponse<bool>> DeleteBatchAsync(Guid id);
    Task<ApiResponse<List<BatchDto>>> GetExpiringBatchesAsync(int daysAhead = 30);
    Task<ApiResponse<bool>> UpdateBatchStatusesAsync();
    Task<ApiResponse<bool>> WriteOffBatchAsync(Guid batchId, string reason);

    Task<ApiResponse<List<StockTransferDto>>> GetTransfersAsync(TransferStatus? status);
    Task<ApiResponse<StockTransferDto>> CreateTransferAsync(CreateStockTransferDto dto);
    Task<ApiResponse<StockTransferDto>> ApproveTransferAsync(Guid id);
    Task<ApiResponse<StockTransferDto>> CompleteTransferAsync(Guid id);
    Task<ApiResponse<bool>> CancelTransferAsync(Guid id);

    Task<ApiResponse<ProductWarehouseDto>> GetProductWarehouseStockAsync(Guid productId);
    Task<ApiResponse<List<WarehouseStockDto>>> GetWarehouseStockAsync(Guid warehouseId);
    Task<ApiResponse<WarehouseStockDto>> GetProductStockInWarehouseAsync(Guid warehouseId, Guid productId);

    Task<ApiResponse<List<WarehouseStockDto>>> GetLowStockAlertsAsync();

    Task<ApiResponse<bool>> DeductStockAsync(DeductStockDto dto);

    Task<ApiResponse<List<BatchDto>>> GetProductBatchesAsync(Guid productId, Guid warehouseId);
    Task<ApiResponse<List<BatchDto>>> GetFefoBatchesAsync(Guid productId, Guid warehouseId, int quantity);

    Task<List<ExpiryAlertDto>> CheckExpiryAlertsAsync();
}

public class DeductStockDto
{
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public int Quantity { get; set; }
    public string ReferenceType { get; set; } = "INVOICE";
    public Guid ReferenceId { get; set; }
}
