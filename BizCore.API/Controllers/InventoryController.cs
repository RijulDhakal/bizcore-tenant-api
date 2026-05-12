using BizCore.Application.DTOs.Inventory;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Shared.Wrappers;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BizCore.API.Controllers;

[Authorize(Roles = "SuperAdmin,Admin,Owner,Accountant,Sales,POSOperator")]
[ApiController]
[Route("api/inventory")]
public class InventoryController : ControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories() => Ok(await _inventoryService.GetCategoriesAsync());

    [HttpPost("categories")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> CreateCategory(CreateCategoryDto dto) => Ok(await _inventoryService.CreateCategoryAsync(dto));

    [HttpPut("categories/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> UpdateCategory(Guid id, CreateCategoryDto dto) => Ok(await _inventoryService.UpdateCategoryAsync(id, dto));

    [HttpDelete("categories/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> DeleteCategory(Guid id, [FromQuery] Guid? targetCategoryId = null) 
        => Ok(await _inventoryService.DeleteCategoryAsync(id, targetCategoryId));

    [HttpGet("products")]
    public async Task<IActionResult> GetProducts(string? search, Guid? categoryId, bool lowStockOnly = false) 
        => Ok(await _inventoryService.GetProductsAsync(search, categoryId, lowStockOnly));

    [HttpGet("products/{id}")]
    public async Task<IActionResult> GetProduct(Guid id) => Ok(await _inventoryService.GetProductByIdAsync(id));

    [HttpPost("products")]
    public async Task<IActionResult> CreateProduct(CreateProductDto dto) => Ok(await _inventoryService.CreateProductAsync(dto));

    [HttpPut("products/{id}")]
    public async Task<IActionResult> UpdateProduct(Guid id, UpdateProductDto dto) => Ok(await _inventoryService.UpdateProductAsync(id, dto));

    [HttpDelete("products/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> DeleteProduct(Guid id) => Ok(await _inventoryService.DeleteProductAsync(id));

    [HttpGet("products/low-stock")]
    public async Task<IActionResult> GetLowStock() => Ok(await _inventoryService.GetLowStockProductsAsync());

    [HttpGet("warehouses")]
    public async Task<IActionResult> GetWarehouses() => Ok(await _inventoryService.GetWarehousesAsync());

    [HttpPost("warehouses")]
    public async Task<IActionResult> CreateWarehouse(CreateWarehouseDto dto) => Ok(await _inventoryService.CreateWarehouseAsync(dto));

    [HttpPut("warehouses/{id}")]
    public async Task<IActionResult> UpdateWarehouse(Guid id, CreateWarehouseDto dto) => Ok(await _inventoryService.UpdateWarehouseAsync(id, dto));

    [HttpPost("stock/adjust")]
    public async Task<IActionResult> AdjustStock(AdjustStockDto dto) => Ok(await _inventoryService.AdjustStockAsync(dto));

    [HttpPost("stock/transfer")]
    public async Task<IActionResult> TransferStock(TransferStockDto dto) => Ok(await _inventoryService.TransferStockAsync(dto));

    [HttpGet("stock/movements")]
    public async Task<IActionResult> GetMovements(Guid? productId, Guid? warehouseId, DateTime? dateFrom, DateTime? dateTo) 
        => Ok(await _inventoryService.GetStockMovementsAsync(productId, warehouseId, dateFrom, dateTo));

    [HttpGet("stock/summary")]
    public async Task<IActionResult> GetSummary() => Ok(await _inventoryService.GetInventorySummaryAsync());

    [HttpGet("batches")]
    public async Task<IActionResult> GetBatches(Guid? productId) => Ok(await _inventoryService.GetBatchesAsync(productId));

    [HttpPost("batches")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> CreateBatch(CreateBatchDto dto) => Ok(await _inventoryService.CreateBatchAsync(dto));

    [HttpPut("batches/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> UpdateBatch(Guid id, UpdateBatchDto dto) => Ok(await _inventoryService.UpdateBatchAsync(id, dto));

    [HttpDelete("batches/{id}")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> DeleteBatch(Guid id) => Ok(await _inventoryService.DeleteBatchAsync(id));

    [HttpGet("batches/expiring")]
    public async Task<IActionResult> GetExpiringBatches([FromQuery] int daysAhead = 30) => Ok(await _inventoryService.GetExpiringBatchesAsync(daysAhead));

    [HttpGet("transfers")]
    public async Task<IActionResult> GetTransfers(TransferStatus? status) => Ok(await _inventoryService.GetTransfersAsync(status));

    [HttpPost("transfers")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> CreateTransfer(CreateStockTransferDto dto) => Ok(await _inventoryService.CreateTransferAsync(dto));

    [HttpPost("transfers/{id}/approve")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> ApproveTransfer(Guid id) => Ok(await _inventoryService.ApproveTransferAsync(id));

    [HttpPost("transfers/{id}/complete")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> CompleteTransfer(Guid id) => Ok(await _inventoryService.CompleteTransferAsync(id));

    [HttpPost("transfers/{id}/cancel")]
    [Authorize(Roles = "SuperAdmin,Admin,Owner")]
    public async Task<IActionResult> CancelTransfer(Guid id) => Ok(await _inventoryService.CancelTransferAsync(id));

    [HttpGet("products/{productId}/stock")]
    public async Task<IActionResult> GetProductStock(Guid productId) => Ok(await _inventoryService.GetProductWarehouseStockAsync(productId));

    [HttpGet("warehouses/{warehouseId}/stock")]
    public async Task<IActionResult> GetWarehouseStock(Guid warehouseId) => Ok(await _inventoryService.GetWarehouseStockAsync(warehouseId));

    [HttpGet("warehouses/{warehouseId}/products/{productId}/stock")]
    public async Task<IActionResult> GetProductInWarehouseStock(Guid warehouseId, Guid productId) 
        => Ok(await _inventoryService.GetProductStockInWarehouseAsync(warehouseId, productId));

    [HttpGet("stock/alerts/low-stock")]
    public async Task<IActionResult> GetLowStockAlerts() => Ok(await _inventoryService.GetLowStockAlertsAsync());

    [HttpGet("expiry-alerts")]
    public async Task<IActionResult> GetExpiryAlerts()
    {
        var alerts = await _inventoryService.CheckExpiryAlertsAsync();
        return Ok(ApiResponse<List<ExpiryAlertDto>>.SuccessResult(alerts));
    }
}
