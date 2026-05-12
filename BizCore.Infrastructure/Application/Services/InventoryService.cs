using BizCore.Application.DTOs.Inventory;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public InventoryService(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    private BatchDto MapToDto(Batch batch) => new(
        batch.Id, batch.ProductId, batch.Product.Name, batch.BatchNumber,
        batch.ManufactureDate, batch.ExpiryDate, batch.InitialQuantity, batch.CurrentQuantity,
        batch.UnitCost, batch.Location, batch.Status, batch.Notes, batch.CreatedAt);

    public async Task<ApiResponse<List<CategoryDto>>> GetCategoriesAsync()
    {
        var tenantId = _tenantService.GetTenantId();
        var allCategories = await _context.Categories
            .Where(c => c.TenantId == tenantId && !c.IsDeleted)
            .Include(c => c.Products)
            .OrderBy(c => c.Name)
            .ToListAsync();

        var categoryDtos = allCategories.Select(c => new CategoryDto(
            c.Id, 
            c.Name.Trim(), 
            c.Description, 
            c.Products.Count, 
            c.ParentCategoryId, 
            new List<CategoryDto>())
        ).ToList();

        var tree = BuildCategoryTree(categoryDtos);
        return ApiResponse<List<CategoryDto>>.SuccessResult(tree);
    }

    private List<CategoryDto> BuildCategoryTree(List<CategoryDto> categories, Guid? parentId = null)
    {
        return categories
            .Where(c => c.ParentCategoryId == parentId)
            .Select(c => {
                var subCategories = BuildCategoryTree(categories, c.Id);
                
                return c with { 
                    ProductCount = c.ProductCount, 
                    SubCategories = subCategories 
                };
            })
            .ToList();
    }

    public async Task<ApiResponse<CategoryDto>> CreateCategoryAsync(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            Description = dto.Description,
            ParentCategoryId = dto.ParentCategoryId,
            TenantId = _tenantService.GetTenantId()
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return ApiResponse<CategoryDto>.SuccessResult(new CategoryDto(category.Id, category.Name, category.Description, 0, category.ParentCategoryId, null));
    }

    public async Task<ApiResponse<bool>> UpdateCategoryAsync(Guid id, CreateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null) return ApiResponse<bool>.FailResult("Category not found");

        category.Name = dto.Name;
        category.Description = dto.Description;
        category.ParentCategoryId = dto.ParentCategoryId;

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> DeleteCategoryAsync(Guid id, Guid? targetCategoryId = null)
    {
        var category = await _context.Categories
            .Include(c => c.Products)
            .Include(c => c.SubCategories)
            .FirstOrDefaultAsync(c => c.Id == id);
            
        if (category == null) return ApiResponse<bool>.FailResult("Category not found");

        // If there are products and no target category is provided, we can't delete safely
        if (category.Products.Any() && targetCategoryId == null)
        {
            return ApiResponse<bool>.FailResult("Category contains products. Please specify a target category to move them to.");
        }

        // Move products if target category is provided
        if (category.Products.Any() && targetCategoryId != null)
        {
            foreach (var product in category.Products)
            {
                product.CategoryId = targetCategoryId;
            }
        }

        // Re-parent sub-categories if any
        if (category.SubCategories.Any())
        {
            foreach (var sub in category.SubCategories)
            {
                sub.ParentCategoryId = category.ParentCategoryId;
            }
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<List<ProductDto>>> GetProductsAsync(string? search, Guid? categoryId, bool lowStockOnly)
    {
        var tenantId = _tenantService.GetTenantId();
        var query = _context.Products
            .Where(p => p.TenantId == tenantId)
            .Include(p => p.Category)
            .Include(p => p.Batches.Where(b => !b.IsDeleted))
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Name.Contains(search) || p.SKU.Contains(search) || (p.Barcode != null && p.Barcode.Contains(search)));

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId);

        if (lowStockOnly)
            query = query.Where(p => p.WarehouseStocks.Sum(ws => ws.CurrentStock) <= p.LowStockThreshold);

        var products = await query
            .OrderBy(p => p.Name)
            .Select(p => new ProductDto(
                p.Id, p.Name, p.SKU, p.Description, p.CategoryId,
                p.Category != null ? p.Category.Name : null,
                p.CostPrice, p.SellingPrice, p.IsVatApplicable, p.Brand, p.ReorderQuantity, p.TrackExpiry, p.HSNCode,
                p.LowStockThreshold, p.Unit, p.Barcode, p.IsActive, 
                p.WarehouseStocks.Sum(ws => ws.CurrentStock),
                null, null))
            .ToListAsync();

        return ApiResponse<List<ProductDto>>.SuccessResult(products);
    }

    public async Task<ApiResponse<ProductDto>> GetProductByIdAsync(Guid id)
    {
        var p = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (p == null) return ApiResponse<ProductDto>.FailResult("Product not found");

        return ApiResponse<ProductDto>.SuccessResult(new ProductDto(
            p.Id, p.Name, p.SKU, p.Description, p.CategoryId,
            p.Category != null ? p.Category.Name : null,
            p.CostPrice, p.SellingPrice, p.IsVatApplicable, p.Brand, p.ReorderQuantity, p.TrackExpiry, p.HSNCode,
            p.LowStockThreshold, p.Unit, p.Barcode, p.IsActive, 
            p.WarehouseStocks.Sum(ws => ws.CurrentStock),
            null, null));
    }

    public async Task<ApiResponse<ProductDto>> CreateProductAsync(CreateProductDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var sku = string.IsNullOrEmpty(dto.SKU) ? $"SKU-{Guid.NewGuid().ToString()[..6].ToUpper()}" : dto.SKU;

        if (await _context.Products.AnyAsync(p => p.SKU == sku))
            return ApiResponse<ProductDto>.FailResult("SKU already exists");

        var totalStock = dto.WarehouseStocks?.Sum(ws => ws.OpeningStock) ?? 0;

        var product = new Product
        {
            TenantId = tenantId,
            Name = dto.Name,
            SKU = sku,
            Description = dto.Description,
            CategoryId = dto.CategoryId,
            CostPrice = dto.CostPrice,
            SellingPrice = dto.SellingPrice,
            IsVatApplicable = dto.IsVatApplicable,
            Brand = dto.Brand,
            ReorderQuantity = dto.ReorderQuantity,
            TrackExpiry = dto.TrackExpiry,
            HSNCode = dto.HSNCode,
            LowStockThreshold = dto.LowStockThreshold,
            Unit = dto.Unit,
            Barcode = dto.Barcode,
            IsActive = dto.IsActive,
            CurrentStock = totalStock
        };

        _context.Products.Add(product);

        foreach (var wsEntry in dto.WarehouseStocks ?? [])
        {
            if (wsEntry.OpeningStock <= 0) continue;

            var warehouseStock = new WarehouseStock
            {
                TenantId = tenantId,
                WarehouseId = wsEntry.WarehouseId,
                ProductId = product.Id,
                CurrentStock = wsEntry.OpeningStock,
                ReservedStock = 0
            };
            _context.WarehouseStocks.Add(warehouseStock);

            var movement = new StockMovement
            {
                ProductId = product.Id,
                TenantId = tenantId,
                WarehouseId = wsEntry.WarehouseId,
                Type = StockMovementType.StockIn,
                Quantity = wsEntry.OpeningStock,
                ReferenceType = "OpeningStock",
                Note = $"Opening stock on product creation",
                MovedAt = DateTime.UtcNow
            };
            _context.StockMovements.Add(movement);

            if (dto.TrackExpiry && !string.IsNullOrEmpty(wsEntry.BatchNumber))
            {
                var batch = new Batch
                {
                    TenantId = tenantId,
                    ProductId = product.Id,
                    BatchNumber = wsEntry.BatchNumber,
                    ExpiryDate = wsEntry.ExpiryDate,
                    ManufactureDate = wsEntry.ManufactureDate,
                    InitialQuantity = wsEntry.OpeningStock,
                    CurrentQuantity = wsEntry.OpeningStock
                };
                _context.Batches.Add(batch);
                warehouseStock.BatchId = batch.Id;
            }
        }

        await _context.SaveChangesAsync();

        return await GetProductByIdAsync(product.Id);
    }

    public async Task<ApiResponse<bool>> UpdateProductAsync(Guid id, UpdateProductDto dto)
    {
        var p = await _context.Products.FindAsync(id);
        if (p == null) return ApiResponse<bool>.FailResult("Product not found");

        p.Name = dto.Name;
        p.Description = dto.Description;
        p.CategoryId = dto.CategoryId;
        p.CostPrice = dto.CostPrice;
        p.SellingPrice = dto.SellingPrice;
        p.IsVatApplicable = dto.IsVatApplicable;
        p.Brand = dto.Brand;
        p.ReorderQuantity = dto.ReorderQuantity;
        p.TrackExpiry = dto.TrackExpiry;
        p.HSNCode = dto.HSNCode;
        p.LowStockThreshold = dto.LowStockThreshold;
        p.Unit = dto.Unit;
        p.Barcode = dto.Barcode;
        p.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> DeleteProductAsync(Guid id)
    {
        var p = await _context.Products.FindAsync(id);
        if (p == null) return ApiResponse<bool>.FailResult("Product not found");

        p.IsDeleted = true;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<List<ProductDto>>> GetLowStockProductsAsync()
    {
        return await GetProductsAsync(null, null, true);
    }

    public async Task<ApiResponse<List<WarehouseDto>>> GetWarehousesAsync()
    {
        var tenantId = _tenantService.GetTenantId();
        var w = await _context.Warehouses
            .Where(w => w.TenantId == tenantId && !w.IsDeleted)
            .OrderByDescending(x => x.IsDefault)
            .OrderBy(x => x.Name)
            .Select(x => new WarehouseDto(
                x.Id, x.Name, x.Code, x.Location, x.Address, x.City, x.District,
                x.ContactPerson, x.ContactPhone, (int)x.Type, (int)x.Status,
                x.AllowNegativeStock, x.IsDefault, x.IsActive))
            .ToListAsync();

        return ApiResponse<List<WarehouseDto>>.SuccessResult(w);
    }

    public async Task<ApiResponse<WarehouseDto>> CreateWarehouseAsync(CreateWarehouseDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        
        if (dto.IsDefault)
        {
            var existingDefaults = await _context.Warehouses.Where(x => x.TenantId == tenantId && x.IsDefault).ToListAsync();
            foreach (var wh in existingDefaults) wh.IsDefault = false;
        }

        var warehouse = new Warehouse
        {
            TenantId = tenantId,
            Name = dto.Name,
            Code = dto.Code ?? await GenerateWarehouseCodeAsync(tenantId),
            Location = dto.Location,
            Address = dto.Address,
            City = dto.City,
            District = dto.District,
            ContactPerson = dto.ContactPerson,
            ContactPhone = dto.ContactPhone,
            Type = (WarehouseType)dto.Type,
            Status = (WarehouseStatus)dto.Status,
            AllowNegativeStock = dto.AllowNegativeStock,
            IsDefault = dto.IsDefault,
            IsActive = dto.IsActive
        };

        _context.Warehouses.Add(warehouse);
        await _context.SaveChangesAsync();

        return ApiResponse<WarehouseDto>.SuccessResult(new WarehouseDto(
            warehouse.Id, warehouse.Name, warehouse.Code, warehouse.Location, warehouse.Address,
            warehouse.City, warehouse.District, warehouse.ContactPerson, warehouse.ContactPhone,
            (int)warehouse.Type, (int)warehouse.Status, warehouse.AllowNegativeStock,
            warehouse.IsDefault, warehouse.IsActive));
    }

    public async Task<ApiResponse<bool>> UpdateWarehouseAsync(Guid id, CreateWarehouseDto dto)
    {
        var w = await _context.Warehouses.FindAsync(id);
        if (w == null) return ApiResponse<bool>.FailResult("Warehouse not found");

        if (dto.IsDefault && !w.IsDefault)
        {
            var existingDefaults = await _context.Warehouses.Where(x => x.TenantId == w.TenantId && x.IsDefault).ToListAsync();
            foreach (var item in existingDefaults) item.IsDefault = false;
        }

        w.Name = dto.Name;
        w.Code = dto.Code ?? w.Code;
        w.Location = dto.Location;
        w.Address = dto.Address;
        w.City = dto.City;
        w.District = dto.District;
        w.ContactPerson = dto.ContactPerson;
        w.ContactPhone = dto.ContactPhone;
        w.Type = (WarehouseType)dto.Type;
        w.Status = (WarehouseStatus)dto.Status;
        w.AllowNegativeStock = dto.AllowNegativeStock;
        w.IsDefault = dto.IsDefault;
        w.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<string> GenerateWarehouseCodeAsync(Guid tenantId)
    {
        var count = await _context.Warehouses.Where(x => x.TenantId == tenantId).CountAsync() + 1;
        return $"WH-{count:D3}";
    }

    public async Task<ApiResponse<Warehouse>> EnsureDefaultWarehouseAsync(Guid tenantId)
    {
        var w = await _context.Warehouses.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.TenantId == tenantId && x.IsDefault);
        if (w == null)
        {
            var code = await GenerateWarehouseCodeAsync(tenantId);
            w = new Warehouse
            {
                TenantId = tenantId,
                Name = "Main Warehouse",
                Code = code,
                Location = "Default Location",
                Address = "Default Address",
                City = "Default City",
                ContactPerson = "Admin",
                ContactPhone = "0000000000",
                Type = WarehouseType.Godown,
                Status = WarehouseStatus.Operational,
                IsDefault = true
            };
            _context.Warehouses.Add(w);
            await _context.SaveChangesAsync();
        }
        return ApiResponse<Warehouse>.SuccessResult(w);
    }

    public async Task<ApiResponse<bool>> AdjustStockAsync(AdjustStockDto dto)
    {
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return ApiResponse<bool>.FailResult("Product not found");

        var warehouseStock = await _context.WarehouseStocks
            .FirstOrDefaultAsync(ws => ws.WarehouseId == dto.WarehouseId && ws.ProductId == dto.ProductId);

        if (dto.Type == StockMovementType.StockOut || dto.Type == StockMovementType.Adjustment)
        {
            var currentStock = warehouseStock?.CurrentStock ?? 0;
            if (dto.Quantity < 0 && currentStock + dto.Quantity < 0)
                return ApiResponse<bool>.FailResult("Insufficient stock");
        }

        var movement = new StockMovement
        {
            TenantId = _tenantService.GetTenantId(),
            ProductId = dto.ProductId,
            WarehouseId = dto.WarehouseId,
            Type = dto.Type,
            Quantity = dto.Quantity,
            Note = dto.Note,
            ReferenceType = "Manual",
            MovedAt = DateTime.UtcNow
        };

        _context.StockMovements.Add(movement);

        if (warehouseStock != null)
        {
            warehouseStock.CurrentStock += dto.Quantity;
            warehouseStock.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            var tenantId = _tenantService.GetTenantId();
            _context.WarehouseStocks.Add(new WarehouseStock
            {
                TenantId = tenantId,
                WarehouseId = dto.WarehouseId,
                ProductId = dto.ProductId,
                CurrentStock = dto.Quantity,
                ReservedStock = 0
            });
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> TransferStockAsync(TransferStockDto dto)
    {
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return ApiResponse<bool>.FailResult("Product not found");

        var sourceStock = await _context.WarehouseStocks
            .FirstOrDefaultAsync(ws => ws.WarehouseId == dto.SourceWarehouseId && ws.ProductId == dto.ProductId);

        if (sourceStock == null || sourceStock.CurrentStock < dto.Quantity)
             return ApiResponse<bool>.FailResult("Insufficient stock");

        var tenantId = _tenantService.GetTenantId();
        
        var outMovement = new StockMovement
        {
            TenantId = tenantId,
            ProductId = dto.ProductId,
            WarehouseId = dto.SourceWarehouseId,
            Type = StockMovementType.Transfer,
            Quantity = -dto.Quantity,
            Note = $"Transfer to {dto.DestinationWarehouseId}: {dto.Note}",
            ReferenceType = "Manual",
            MovedAt = DateTime.UtcNow
        };

        var inMovement = new StockMovement
        {
            TenantId = tenantId,
            ProductId = dto.ProductId,
            WarehouseId = dto.DestinationWarehouseId,
            Type = StockMovementType.Transfer,
            Quantity = dto.Quantity,
            Note = $"Transfer from {dto.SourceWarehouseId}: {dto.Note}",
            ReferenceType = "Manual",
            MovedAt = DateTime.UtcNow
        };

        _context.StockMovements.Add(outMovement);
        _context.StockMovements.Add(inMovement);

        var destStock = await _context.WarehouseStocks
            .FirstOrDefaultAsync(ws => ws.WarehouseId == dto.DestinationWarehouseId && ws.ProductId == dto.ProductId);

        if (sourceStock != null)
        {
            sourceStock.CurrentStock -= dto.Quantity;
            sourceStock.UpdatedAt = DateTime.UtcNow;
        }

        if (destStock != null)
        {
            destStock.CurrentStock += dto.Quantity;
            destStock.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.WarehouseStocks.Add(new WarehouseStock
            {
                TenantId = tenantId,
                WarehouseId = dto.DestinationWarehouseId,
                ProductId = dto.ProductId,
                CurrentStock = dto.Quantity
            });
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<List<StockMovementDto>>> GetStockMovementsAsync(Guid? productId, Guid? warehouseId, DateTime? dateFrom, DateTime? dateTo)
    {
        var query = _context.StockMovements.Include(m => m.Product).Include(m => m.Warehouse).AsQueryable();

        if (productId.HasValue) query = query.Where(m => m.ProductId == productId);
        if (warehouseId.HasValue) query = query.Where(m => m.WarehouseId == warehouseId);
        if (dateFrom.HasValue) query = query.Where(m => m.MovedAt >= dateFrom);
        if (dateTo.HasValue) query = query.Where(m => m.MovedAt <= dateTo);

        var movements = await query
            .OrderByDescending(m => m.MovedAt)
            .Select(m => new StockMovementDto(
                m.Id, m.ProductId, m.Product.Name, m.WarehouseId, m.Warehouse.Name, 
                m.Type, m.Quantity, m.ReferenceType, m.ReferenceId, m.Note, m.MovedAt))
            .ToListAsync();

        return ApiResponse<List<StockMovementDto>>.SuccessResult(movements);
    }

    public async Task<ApiResponse<InventorySummaryDto>> GetInventorySummaryAsync()
    {
        var tenantId = _tenantService.GetTenantId();
        
        var productCount = await _context.Products.CountAsync(p => p.TenantId == tenantId);
        
        var stockWithProducts = await _context.WarehouseStocks
            .Include(ws => ws.Product)
            .Where(ws => ws.TenantId == tenantId)
            .ToListAsync();
        
        var totalValue = stockWithProducts.Sum(ws => ws.CurrentStock * ws.Product.CostPrice);
        
        var lowStockCount = stockWithProducts
            .Count(ws => ws.CurrentStock <= ws.Product.LowStockThreshold);

        return ApiResponse<InventorySummaryDto>.SuccessResult(new InventorySummaryDto(totalValue, productCount, lowStockCount));
    }

    public async Task<ApiResponse<List<BatchDto>>> GetBatchesAsync(Guid? productId)
    {
        var query = _context.Batches.Include(b => b.Product).AsQueryable();
        
        if (productId.HasValue)
            query = query.Where(b => b.ProductId == productId);

        var batches = await query
            .OrderByDescending(b => b.CreatedAt)
            .Include(b => b.Product)
            .Include(b => b.Warehouse)
            .ToListAsync();

        var dtos = batches.Select(b => new BatchDto(
            b.Id, b.ProductId, b.Product.Name, b.BatchNumber,
            b.ManufactureDate, b.ExpiryDate, b.InitialQuantity, b.CurrentQuantity,
            b.UnitCost, b.Location, b.Status, b.Notes, b.CreatedAt)).ToList();

        return ApiResponse<List<BatchDto>>.SuccessResult(dtos);
    }

    public async Task<ApiResponse<BatchDto>> CreateBatchAsync(CreateBatchDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return ApiResponse<BatchDto>.FailResult("Product not found");

        var batchNumber = dto.BatchNumber;
        if (string.IsNullOrEmpty(batchNumber))
        {
            batchNumber = $"BATCH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString()[..4].ToUpper()}";
        }
        else
        {
            var existingBatch = await _context.Batches.FirstOrDefaultAsync(b => b.BatchNumber == batchNumber && b.ProductId == dto.ProductId);
            if (existingBatch != null) return ApiResponse<BatchDto>.FailResult("Batch number already exists for this product");
        }

        var batch = new Batch
        {
            TenantId = tenantId,
            ProductId = dto.ProductId,
            WarehouseId = dto.WarehouseId,
            BatchNumber = batchNumber,
            ManufactureDate = dto.ManufactureDate,
            ExpiryDate = dto.ExpiryDate,
            InitialQuantity = dto.InitialQuantity,
            CurrentQuantity = dto.InitialQuantity,
            UnitCost = dto.UnitCost,
            Location = dto.Location,
            Status = BatchStatus.Active,
            Notes = dto.Notes
        };

        _context.Batches.Add(batch);
        
        if (dto.InitialQuantity > 0)
        {
            var defaultWarehouse = await _context.Warehouses
                .IgnoreQueryFilters()
                .Where(w => w.TenantId == tenantId && !w.IsDeleted)
                .OrderByDescending(w => w.IsDefault)
                .FirstOrDefaultAsync();

            if (defaultWarehouse != null)
            {
                var warehouseStock = await _context.WarehouseStocks
                    .FirstOrDefaultAsync(ws => ws.WarehouseId == defaultWarehouse.Id && ws.ProductId == dto.ProductId);

                if (warehouseStock != null)
                {
                    warehouseStock.CurrentStock += dto.InitialQuantity;
                    warehouseStock.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.WarehouseStocks.Add(new WarehouseStock
                    {
                        TenantId = tenantId,
                        WarehouseId = defaultWarehouse.Id,
                        ProductId = dto.ProductId,
                        CurrentStock = dto.InitialQuantity
                    });
                }
            }
        }

        await _context.SaveChangesAsync();

        return ApiResponse<BatchDto>.SuccessResult(new BatchDto(
            batch.Id, batch.ProductId, product.Name, batch.BatchNumber,
            batch.ManufactureDate, batch.ExpiryDate, batch.InitialQuantity, batch.CurrentQuantity,
            batch.UnitCost, batch.Location, batch.Status, batch.Notes, batch.CreatedAt));
    }

    public async Task<ApiResponse<BatchDto>> UpdateBatchAsync(Guid id, UpdateBatchDto dto)
    {
        var batch = await _context.Batches.Include(b => b.Product).FirstOrDefaultAsync(b => b.Id == id);
        if (batch == null) return ApiResponse<BatchDto>.FailResult("Batch not found");

        if (!string.IsNullOrEmpty(dto.BatchNumber))
            batch.BatchNumber = dto.BatchNumber;
        if (dto.ManufactureDate.HasValue)
            batch.ManufactureDate = dto.ManufactureDate;
        if (dto.ExpiryDate.HasValue)
            batch.ExpiryDate = dto.ExpiryDate;
        if (!string.IsNullOrEmpty(dto.Location))
            batch.Location = dto.Location;
        if (!string.IsNullOrEmpty(dto.Notes))
            batch.Notes = dto.Notes;
        if (dto.Status.HasValue)
            batch.Status = dto.Status.Value;

        await _context.SaveChangesAsync();

        return ApiResponse<BatchDto>.SuccessResult(new BatchDto(
            batch.Id, batch.ProductId, batch.Product.Name, batch.BatchNumber,
            batch.ManufactureDate, batch.ExpiryDate, batch.InitialQuantity, batch.CurrentQuantity,
            batch.UnitCost, batch.Location, batch.Status, batch.Notes, batch.CreatedAt));
    }

    public async Task<ApiResponse<bool>> DeleteBatchAsync(Guid id)
    {
        var batch = await _context.Batches.FindAsync(id);
        if (batch == null) return ApiResponse<bool>.FailResult("Batch not found");

        batch.IsDeleted = true;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<List<BatchDto>>> GetExpiringBatchesAsync(int daysAhead = 30)
    {
        var cutoffDate = DateTime.UtcNow.AddDays(daysAhead);

        var batches = await _context.Batches
            .Include(b => b.Product)
            .Include(b => b.Warehouse)
            .Where(b => b.ExpiryDate.HasValue && b.ExpiryDate <= cutoffDate && b.CurrentQuantity > 0 && b.Status == BatchStatus.Active)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();

        var dtos = batches.Select(b => new BatchDto(
            b.Id, b.ProductId, b.Product.Name, b.BatchNumber,
            b.ManufactureDate, b.ExpiryDate, b.InitialQuantity, b.CurrentQuantity,
            b.UnitCost, b.Location, b.Status, b.Notes, b.CreatedAt)).ToList();

        return ApiResponse<List<BatchDto>>.SuccessResult(dtos);
    }

    public async Task<ApiResponse<bool>> UpdateBatchStatusesAsync()
    {
        var batches = await _context.Batches
            .Where(b => b.CurrentQuantity > 0)
            .ToListAsync();

        var today = DateTime.UtcNow.Date;
        var expiringCutoff = today.AddDays(30);
        var updated = 0;

        foreach (var batch in batches)
        {
            if (batch.ExpiryDate.HasValue)
            {
                var expiryDate = batch.ExpiryDate.Value.Date;
                
                if (expiryDate < today)
                {
                    if (batch.Status != BatchStatus.Expired)
                    {
                        batch.Status = BatchStatus.Expired;
                        updated++;
                    }
                }
                else if (expiryDate <= expiringCutoff)
                {
                    if (batch.Status != BatchStatus.Expiring)
                    {
                        batch.Status = BatchStatus.Expiring;
                        updated++;
                    }
                }
                else
                {
                    if (batch.Status != BatchStatus.Active)
                    {
                        batch.Status = BatchStatus.Active;
                        updated++;
                    }
                }
            }
            else if (batch.CurrentQuantity == 0 && batch.Status != BatchStatus.Consumed)
            {
                batch.Status = BatchStatus.Consumed;
                updated++;
            }
        }

        if (updated > 0)
            await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true, $"Updated {updated} batch statuses");
    }

    public async Task<ApiResponse<bool>> WriteOffBatchAsync(Guid batchId, string reason)
    {
        var batch = await _context.Batches.FindAsync(batchId);
        if (batch == null)
            return ApiResponse<bool>.FailResult("Batch not found");

        if (batch.CurrentQuantity <= 0)
            return ApiResponse<bool>.FailResult("Batch has no stock to write off");

        batch.Status = BatchStatus.WrittenOff;
        batch.Notes = (batch.Notes ?? "") + $"; Written off: {reason}";

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Batch written off");
    }

    public async Task<ApiResponse<List<StockTransferDto>>> GetTransfersAsync(TransferStatus? status)
    {
        var query = _context.StockTransfers
            .Include(t => t.FromWarehouse)
            .Include(t => t.ToWarehouse)
            .Include(t => t.Product)
            .Include(t => t.Batch)
            .AsQueryable();

        if (status.HasValue)
            query = query.Where(t => t.Status == status);

        var transfers = await query
            .OrderByDescending(t => t.TransferredAt)
            .Select(t => new StockTransferDto(
                t.Id, t.FromWarehouseId, t.FromWarehouse.Name,
                t.ToWarehouseId, t.ToWarehouse.Name, t.ProductId, t.Product.Name,
                t.BatchId, t.Batch != null ? t.Batch.BatchNumber : null,
                t.Quantity, t.Status, t.Notes, t.ApprovedBy, t.ApprovedAt, t.TransferredAt,
                t.Type, t.Priority, t.ExpectedDeliveryDate, t.Reason, t.ShippingCost, t.TrackingNumber, t.RequiresApproval))
            .ToListAsync();

        return ApiResponse<List<StockTransferDto>>.SuccessResult(transfers);
    }

    public async Task<ApiResponse<StockTransferDto>> CreateTransferAsync(CreateStockTransferDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null) return ApiResponse<StockTransferDto>.FailResult("Product not found");

        var sourceStock = await _context.WarehouseStocks
            .FirstOrDefaultAsync(ws => ws.WarehouseId == dto.FromWarehouseId && ws.ProductId == dto.ProductId);

        if (sourceStock == null || sourceStock.CurrentStock < dto.Quantity)
            return ApiResponse<StockTransferDto>.FailResult("Insufficient stock");

        var fromWarehouse = await _context.Warehouses.FindAsync(dto.FromWarehouseId);
        var toWarehouse = await _context.Warehouses.FindAsync(dto.ToWarehouseId);
        if (fromWarehouse == null || toWarehouse == null)
            return ApiResponse<StockTransferDto>.FailResult("Warehouse not found");

        var transfer = new StockTransfer
        {
            TenantId = tenantId,
            FromWarehouseId = dto.FromWarehouseId,
            ToWarehouseId = dto.ToWarehouseId,
            ProductId = dto.ProductId,
            BatchId = dto.BatchId,
            Quantity = dto.Quantity,
            Notes = dto.Notes,
            Status = TransferStatus.Pending,
            Type = dto.Type,
            Priority = dto.Priority,
            ExpectedDeliveryDate = dto.ExpectedDeliveryDate,
            Reason = dto.Reason,
            ShippingCost = dto.ShippingCost,
            TrackingNumber = dto.TrackingNumber,
            RequiresApproval = dto.RequiresApproval
        };

        _context.StockTransfers.Add(transfer);
        await _context.SaveChangesAsync();

        return ApiResponse<StockTransferDto>.SuccessResult(new StockTransferDto(
            transfer.Id, transfer.FromWarehouseId, fromWarehouse.Name,
            transfer.ToWarehouseId, toWarehouse.Name, transfer.ProductId, product.Name,
            transfer.BatchId, null, transfer.Quantity, transfer.Status, transfer.Notes,
            transfer.ApprovedBy, transfer.ApprovedAt, transfer.TransferredAt,
            transfer.Type, transfer.Priority, transfer.ExpectedDeliveryDate, transfer.Reason,
            transfer.ShippingCost, transfer.TrackingNumber, transfer.RequiresApproval));
    }

    public async Task<ApiResponse<StockTransferDto>> ApproveTransferAsync(Guid id)
    {
        var transfer = await _context.StockTransfers
            .Include(t => t.FromWarehouse)
            .Include(t => t.ToWarehouse)
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transfer == null) return ApiResponse<StockTransferDto>.FailResult("Transfer not found");
        if (transfer.Status != TransferStatus.Pending)
            return ApiResponse<StockTransferDto>.FailResult("Transfer cannot be approved in current status");

        transfer.Status = TransferStatus.Approved;
        await _context.SaveChangesAsync();

        return ApiResponse<StockTransferDto>.SuccessResult(new StockTransferDto(
            transfer.Id, transfer.FromWarehouseId, transfer.FromWarehouse.Name,
            transfer.ToWarehouseId, transfer.ToWarehouse.Name, transfer.ProductId, transfer.Product.Name,
            transfer.BatchId, null, transfer.Quantity, transfer.Status, transfer.Notes,
            transfer.ApprovedBy, transfer.ApprovedAt, transfer.TransferredAt,
            transfer.Type, transfer.Priority, transfer.ExpectedDeliveryDate, transfer.Reason,
            transfer.ShippingCost, transfer.TrackingNumber, transfer.RequiresApproval));
    }

    public async Task<ApiResponse<StockTransferDto>> CompleteTransferAsync(Guid id)
    {
        var transfer = await _context.StockTransfers
            .Include(t => t.FromWarehouse)
            .Include(t => t.ToWarehouse)
            .Include(t => t.Product)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (transfer == null) return ApiResponse<StockTransferDto>.FailResult("Transfer not found");
        if (transfer.Status != TransferStatus.Approved)
            return ApiResponse<StockTransferDto>.FailResult("Transfer must be approved first");

        var tenantId = _tenantService.GetTenantId();
        var fromStock = await _context.WarehouseStocks
            .FirstOrDefaultAsync(ws => ws.WarehouseId == transfer.FromWarehouseId && ws.ProductId == transfer.ProductId);

        if (fromStock == null || fromStock.CurrentStock < transfer.Quantity)
            return ApiResponse<StockTransferDto>.FailResult("Insufficient stock to complete transfer");

        var outMovement = new StockMovement
        {
            TenantId = tenantId,
            ProductId = transfer.ProductId,
            WarehouseId = transfer.FromWarehouseId,
            Type = StockMovementType.Transfer,
            Quantity = -transfer.Quantity,
            ReferenceType = "StockTransfer",
            ReferenceId = transfer.Id,
            Note = $"Transfer out to {transfer.ToWarehouse.Name}",
            MovedAt = DateTime.UtcNow
        };
        var inMovement = new StockMovement
        {
            TenantId = tenantId,
            ProductId = transfer.ProductId,
            WarehouseId = transfer.ToWarehouseId,
            Type = StockMovementType.Transfer,
            Quantity = transfer.Quantity,
            ReferenceType = "StockTransfer",
            ReferenceId = transfer.Id,
            Note = $"Transfer in from {transfer.FromWarehouse.Name}",
            MovedAt = DateTime.UtcNow
        };

        _context.StockMovements.Add(outMovement);
        _context.StockMovements.Add(inMovement);

        fromStock.CurrentStock -= transfer.Quantity;
        fromStock.UpdatedAt = DateTime.UtcNow;

        var toStock = await _context.WarehouseStocks
            .FirstOrDefaultAsync(ws => ws.WarehouseId == transfer.ToWarehouseId && ws.ProductId == transfer.ProductId);

        if (toStock != null)
        {
            toStock.CurrentStock += transfer.Quantity;
            toStock.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.WarehouseStocks.Add(new WarehouseStock
            {
                TenantId = tenantId,
                WarehouseId = transfer.ToWarehouseId,
                ProductId = transfer.ProductId,
                CurrentStock = transfer.Quantity
            });
        }

        transfer.Status = TransferStatus.Completed;

        await _context.SaveChangesAsync();

        return ApiResponse<StockTransferDto>.SuccessResult(new StockTransferDto(
            transfer.Id, transfer.FromWarehouseId, transfer.FromWarehouse.Name,
            transfer.ToWarehouseId, transfer.ToWarehouse.Name, transfer.ProductId, transfer.Product.Name,
            transfer.BatchId, null, transfer.Quantity, transfer.Status, transfer.Notes,
            transfer.ApprovedBy, transfer.ApprovedAt, transfer.TransferredAt,
            transfer.Type, transfer.Priority, transfer.ExpectedDeliveryDate, transfer.Reason,
            transfer.ShippingCost, transfer.TrackingNumber, transfer.RequiresApproval));
    }

    public async Task<ApiResponse<bool>> CancelTransferAsync(Guid id)
    {
        var transfer = await _context.StockTransfers.FindAsync(id);
        if (transfer == null) return ApiResponse<bool>.FailResult("Transfer not found");
        if (transfer.Status == TransferStatus.Completed)
            return ApiResponse<bool>.FailResult("Cannot cancel completed transfer");

        transfer.Status = TransferStatus.Cancelled;
        await _context.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true);
    }

public async Task<ApiResponse<ProductWarehouseDto>> GetProductWarehouseStockAsync(Guid productId)
    {
        var tenantId = _tenantService.GetTenantId();
        
        var product = await _context.Products
            .Include(p => p.Batches)
            .FirstOrDefaultAsync(p => p.Id == productId && p.TenantId == tenantId);
        
        if (product == null)
            return ApiResponse<ProductWarehouseDto>.FailResult("Product not found");
        
        var warehouseStocks = await _context.WarehouseStocks
            .Include(ws => ws.Warehouse)
            .Where(ws => ws.ProductId == productId && ws.TenantId == tenantId)
            .ToListAsync();
        
        var stockByWarehouse = warehouseStocks.Select(ws => new ProductStockDto(
            ws.ProductId,
            product.Name,
            ws.WarehouseId,
            ws.Warehouse.Name,
            ws.CurrentStock,
            ws.ReservedStock,
            ws.CurrentStock - ws.ReservedStock
        )).ToList();
        
        var totalStock = warehouseStocks.Sum(ws => ws.CurrentStock);
        
        var latestBatch = product.Batches.OrderByDescending(b => b.CreatedAt).FirstOrDefault();
        
        return ApiResponse<ProductWarehouseDto>.SuccessResult(new ProductWarehouseDto(
            product.Id,
            product.Name,
            product.SKU,
            totalStock,
            product.Unit,
            product.TrackExpiry,
            latestBatch?.BatchNumber,
            latestBatch?.Id,
            latestBatch?.CurrentQuantity ?? 0,
            stockByWarehouse
        ));
    }

    public async Task<ApiResponse<List<WarehouseStockDto>>> GetWarehouseStockAsync(Guid warehouseId)
    {
        var tenantId = _tenantService.GetTenantId();
        var stocks = await _context.WarehouseStocks
            .Where(ws => ws.TenantId == tenantId && ws.WarehouseId == warehouseId)
            .Include(ws => ws.Product)
            .Include(ws => ws.Warehouse)
            .Select(ws => new WarehouseStockDto(
                ws.Id,
                ws.WarehouseId,
                ws.Warehouse.Name,
                ws.ProductId,
                ws.Product.Name,
                ws.CurrentStock,
                ws.ReservedStock,
                ws.UpdatedAt))
            .ToListAsync();

        return ApiResponse<List<WarehouseStockDto>>.SuccessResult(stocks);
    }

    public async Task<ApiResponse<WarehouseStockDto>> GetProductStockInWarehouseAsync(Guid warehouseId, Guid productId)
    {
        var tenantId = _tenantService.GetTenantId();
        var stock = await _context.WarehouseStocks
            .Include(ws => ws.Product)
            .Include(ws => ws.Warehouse)
            .FirstOrDefaultAsync(ws => ws.TenantId == tenantId && ws.WarehouseId == warehouseId && ws.ProductId == productId);

        if (stock == null)
            return ApiResponse<WarehouseStockDto>.FailResult("Stock not found");

        return ApiResponse<WarehouseStockDto>.SuccessResult(new WarehouseStockDto(
            stock.Id,
            stock.WarehouseId,
            stock.Warehouse.Name,
            stock.ProductId,
            stock.Product.Name,
            stock.CurrentStock,
            stock.ReservedStock,
            stock.UpdatedAt));
    }

    public async Task<ApiResponse<List<WarehouseStockDto>>> GetLowStockAlertsAsync()
    {
        var tenantId = _tenantService.GetTenantId();
        var stocks = await _context.WarehouseStocks
            .Include(ws => ws.Product)
            .Include(ws => ws.Warehouse)
            .Where(ws => ws.TenantId == tenantId && ws.CurrentStock <= ws.Product.LowStockThreshold)
            .Select(ws => new WarehouseStockDto(
                ws.Id,
                ws.WarehouseId,
                ws.Warehouse.Name,
                ws.ProductId,
                ws.Product.Name,
                ws.CurrentStock,
                ws.ReservedStock,
                ws.UpdatedAt))
            .ToListAsync();

        return ApiResponse<List<WarehouseStockDto>>.SuccessResult(stocks);
    }

    public async Task<ApiResponse<bool>> DeductStockAsync(DeductStockDto dto)
    {
        var product = await _context.Products.FindAsync(dto.ProductId);
        if (product == null)
            return ApiResponse<bool>.FailResult("Product not found");

        var warehouseStock = await _context.WarehouseStocks
            .FirstOrDefaultAsync(ws => ws.ProductId == dto.ProductId && ws.WarehouseId == dto.WarehouseId);

        if (warehouseStock == null || warehouseStock.CurrentStock < dto.Quantity)
            return ApiResponse<bool>.FailResult($"Insufficient stock. Available: {warehouseStock?.CurrentStock ?? 0}");

        if (product.TrackExpiry)
        {
            var batches = await _context.Batches
                .Where(b => b.ProductId == dto.ProductId 
                    && b.Status == BatchStatus.Active 
                    && b.CurrentQuantity > 0
                    && b.ExpiryDate != null)
                .OrderBy(b => b.ExpiryDate)
                .ToListAsync();

            var remainingQty = dto.Quantity;
            
            foreach (var batch in batches)
            {
                if (remainingQty <= 0) break;

                var deductQty = Math.Min(batch.CurrentQuantity, remainingQty);
                batch.CurrentQuantity -= deductQty;
                
                if (batch.CurrentQuantity == 0)
                    batch.Status = BatchStatus.Consumed;

                var movement = new StockMovement
                {
                    Id = Guid.NewGuid(),
                    TenantId = product.TenantId,
                    ProductId = dto.ProductId,
                    BatchId = batch.Id,
                    WarehouseId = dto.WarehouseId,
                    Type = StockMovementType.SaleOut,
                    Quantity = deductQty,
                    ReferenceType = dto.ReferenceType,
                    ReferenceId = dto.ReferenceId,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.StockMovements.Add(movement);

                remainingQty -= deductQty;
            }

            if (remainingQty > 0)
            {
                var nonBatchedStock = warehouseStock.CurrentStock - batches.Sum(b => b.CurrentQuantity);
                if (nonBatchedStock >= remainingQty)
                {
                    warehouseStock.CurrentStock -= remainingQty;
                    
                    var movement = new StockMovement
                    {
                        Id = Guid.NewGuid(),
                        TenantId = product.TenantId,
                        ProductId = dto.ProductId,
                        WarehouseId = dto.WarehouseId,
                        Type = StockMovementType.SaleOut,
                        Quantity = remainingQty,
                        ReferenceType = dto.ReferenceType,
                        ReferenceId = dto.ReferenceId,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    _context.StockMovements.Add(movement);
                }
                else
                {
                    return ApiResponse<bool>.FailResult($"Insufficient batched stock. Remaining needed: {remainingQty}");
                }
            }
        }
        else
        {
            warehouseStock.CurrentStock -= dto.Quantity;

            var movement = new StockMovement
            {
                Id = Guid.NewGuid(),
                TenantId = product.TenantId,
                ProductId = dto.ProductId,
                WarehouseId = dto.WarehouseId,
                Type = StockMovementType.SaleOut,
                Quantity = dto.Quantity,
                ReferenceType = dto.ReferenceType,
                ReferenceId = dto.ReferenceId,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.StockMovements.Add(movement);
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true, "Stock deducted with FEFO");
    }

    public async Task<ApiResponse<List<BatchDto>>> GetProductBatchesAsync(Guid productId, Guid warehouseId)
    {
        var batches = await _context.Batches
            .Include(b => b.Product)
            .Include(b => b.Warehouse)
            .Where(b => b.ProductId == productId && b.WarehouseId == warehouseId)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();

        return ApiResponse<List<BatchDto>>.SuccessResult(batches.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<List<BatchDto>>> GetFefoBatchesAsync(Guid productId, Guid warehouseId, int quantity)
    {
        var batches = await _context.Batches
            .Include(b => b.Product)
            .Include(b => b.Warehouse)
            .Where(b => b.ProductId == productId 
                && b.WarehouseId == warehouseId
                && b.Status == BatchStatus.Active 
                && b.CurrentQuantity > 0
                && b.ExpiryDate != null)
            .OrderBy(b => b.ExpiryDate)
            .ToListAsync();

        var recommended = new List<BatchDto>();
        var remaining = quantity;

        foreach (var batch in batches)
        {
            if (remaining <= 0) break;
            var qty = Math.Min(batch.CurrentQuantity, remaining);
            var dto = MapToDto(batch);
            dto = dto with { RecommendedQuantity = qty, IsFirstExpiry = recommended.Count == 0 };
            recommended.Add(dto);
            remaining -= qty;
        }

        return ApiResponse<List<BatchDto>>.SuccessResult(recommended);
    }

    public async Task<List<ExpiryAlertDto>> CheckExpiryAlertsAsync()
    {
        var alerts = new List<ExpiryAlertDto>();
        var today = DateTime.UtcNow.Date;
        
        var batches = await _context.Batches
            .Include(b => b.Product)
            .Where(b => b.Status == BatchStatus.Active 
                        && b.CurrentQuantity > 0
                        && b.ExpiryDate.HasValue)
            .ToListAsync();
        
        foreach (var batch in batches)
        {
            var daysUntilExpiry = (batch.ExpiryDate!.Value.Date - today).Days;
            
            if (daysUntilExpiry < 0)
            {
                alerts.Add(new ExpiryAlertDto(
                    batch.Id,
                    batch.BatchNumber,
                    batch.Product.Name,
                    daysUntilExpiry,
                    "CRITICAL",
                    $"Batch {batch.BatchNumber} has EXPIRED!",
                    "Write Off"));
            }
            else if (daysUntilExpiry <= 30)
            {
                alerts.Add(new ExpiryAlertDto(
                    batch.Id,
                    batch.BatchNumber,
                    batch.Product.Name,
                    daysUntilExpiry,
                    "HIGH",
                    $"Batch {batch.BatchNumber} expires in {daysUntilExpiry} days!",
                    "Sell Immediately"));
            }
            else if (daysUntilExpiry <= 60)
            {
                alerts.Add(new ExpiryAlertDto(
                    batch.Id,
                    batch.BatchNumber,
                    batch.Product.Name,
                    daysUntilExpiry,
                    "MEDIUM",
                    $"Batch {batch.BatchNumber} expires in {daysUntilExpiry} days",
                    "Plan to sell"));
            }
            else if (daysUntilExpiry <= 90)
            {
                alerts.Add(new ExpiryAlertDto(
                    batch.Id,
                    batch.BatchNumber,
                    batch.Product.Name,
                    daysUntilExpiry,
                    "INFO",
                    $"Batch {batch.BatchNumber} expires in {daysUntilExpiry} days",
                    "Monitor"));
            }
        }
        
        return alerts.OrderBy(a => a.DaysUntilExpiry).ToList();
    }
}
