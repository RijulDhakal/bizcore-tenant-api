using BizCore.Application.DTOs.Purchase;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using BizCore.Shared.Wrappers;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Application.Services;

public class PurchaseService : IPurchaseService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUser;

    public PurchaseService(AppDbContext context, ITenantService tenantService, ICurrentUserService currentUser)
    {
        _context = context;
        _tenantService = tenantService;
        _currentUser = currentUser;
    }

    public async Task<ApiResponse<PurchaseOrderDto>> CreatePurchaseOrderAsync(CreatePurchaseOrderDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        
        // Validate supplier
        var supplier = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == dto.SupplierId && c.TenantId == tenantId);
        if (supplier == null)
            return ApiResponse<PurchaseOrderDto>.FailResult("Supplier not found.");
        
        // Validate products
        var productIds = dto.Items.Select(i => i.ProductId).ToList();
        var existingProducts = await _context.Products
            .Where(p => productIds.Contains(p.Id) && p.TenantId == tenantId)
            .Select(p => p.Id)
            .ToListAsync();
        
        var invalidProducts = productIds.Except(existingProducts).ToList();
        if (invalidProducts.Any())
            return ApiResponse<PurchaseOrderDto>.FailResult($"Invalid products: {invalidProducts.Count}");
        
        var year = DateTime.UtcNow.Year;
        var count = await _context.PurchaseOrders.IgnoreQueryFilters()
            .CountAsync(x => x.TenantId == tenantId && x.OrderDate.Year == year) + 1;
        
        var poNumber = $"PO-{year}-{count:D4}";

        var subTotal = dto.Items.Sum(x => x.Quantity * x.UnitPrice);
        var taxAmount = subTotal * 0.13m; // 13% VAT
        var totalAmount = subTotal + taxAmount;

        var po = new PurchaseOrder
        {
            TenantId = tenantId,
            PONumber = poNumber,
            SupplierId = dto.SupplierId,
            Status = PurchaseOrderStatus.Draft,
            OrderDate = dto.OrderDate,
            ExpectedDelivery = dto.ExpectedDelivery,
            SubTotal = subTotal,
            TaxAmount = taxAmount,
            TotalAmount = totalAmount,
            Notes = dto.Notes,
            Items = dto.Items.Select(i => new PurchaseOrderItem
            {
                ProductId = i.ProductId,
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                Amount = i.Quantity * i.UnitPrice
            }).ToList()
        };

        _context.PurchaseOrders.Add(po);
        await _context.SaveChangesAsync();

        return await GetPurchaseOrderByIdAsync(po.Id);
    }

    public async Task<ApiResponse<List<PurchaseOrderDto>>> GetPurchaseOrdersAsync(string? status, Guid? supplierId, DateTime? dateFrom, DateTime? dateTo)
    {
        var query = _context.PurchaseOrders.Include(x => x.Supplier).AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            var statusList = status.Split(',', StringSplitOptions.RemoveEmptyEntries);
            var parsedStatuses = new List<PurchaseOrderStatus>();
            foreach (var sStr in statusList)
            {
                if (Enum.TryParse<PurchaseOrderStatus>(sStr, true, out var parsedStatus))
                {
                    parsedStatuses.Add(parsedStatus);
                }
            }

            if (parsedStatuses.Any())
                query = query.Where(x => parsedStatuses.Contains(x.Status));
        }

        if (supplierId.HasValue)
            query = query.Where(x => x.SupplierId == supplierId);

        if (dateFrom.HasValue)
            query = query.Where(x => x.OrderDate >= dateFrom);

        if (dateTo.HasValue)
            query = query.Where(x => x.OrderDate <= dateTo);

        var pos = await query
            .OrderByDescending(x => x.OrderDate)
            .Select(x => new PurchaseOrderDto(
                x.Id, x.PONumber, x.SupplierId, x.Supplier.Name, x.Supplier.Phone, x.Supplier.PANNumber,
                x.Status, x.OrderDate, x.ExpectedDelivery, x.ReferenceNumber, x.DeliveryWarehouseId,
                null, x.DeliveryAddress, OrderType.Regular, Priority.Normal, null, x.Currency != null ? x.Currency : Currency.NPR,
                x.ExchangeRate, x.PaymentType, x.AdvanceAmount, x.DueDate, x.SubTotal, x.TaxAmount,
                x.DiscountAmount, x.ShippingCost, x.ExciseDuty, x.TDSAmount, x.TotalAmount,
                x.ApprovalLevel1By, null, x.ApprovalLevel1Date, x.ApprovalLevel1Notes,
                x.ApprovalLevel2By, null, x.ApprovalLevel2Date, x.ApprovalLevel2Notes,
                null, x.Notes, x.CreatedAt,
                x.Items.Select(i => new PurchaseOrderItemDto(
                    i.Id, i.ProductId, i.Product.Name, i.Product.SKU ?? "", i.Description,
                    i.Quantity, i.Unit ?? "pcs", i.UnitPrice, i.TaxRate, i.TaxAmount,
                    i.DiscountPercent, i.DiscountAmount, i.Amount, i.QuantityReceived,
                    i.UnitPriceLand, i.BatchNumber, i.ExpiryDate)).ToList(),
                0, 0
            )).ToListAsync();

        return ApiResponse<List<PurchaseOrderDto>>.SuccessResult(pos);
    }

    public async Task<ApiResponse<PurchaseOrderDto>> GetPurchaseOrderByIdAsync(Guid id)
    {
        var x = await _context.PurchaseOrders
            .Include(x => x.Supplier)
            .Include(x => x.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (x == null) return ApiResponse<PurchaseOrderDto>.FailResult("Purchase order not found");

        var dto = new PurchaseOrderDto(
            x.Id, x.PONumber, x.SupplierId, x.Supplier.Name, x.Supplier.Phone, x.Supplier.PANNumber,
            x.Status, x.OrderDate, x.ExpectedDelivery, x.ReferenceNumber, x.DeliveryWarehouseId,
            null, x.DeliveryAddress, OrderType.Regular, Priority.Normal, null, x.Currency != null ? x.Currency : Currency.NPR,
            x.ExchangeRate, x.PaymentType, x.AdvanceAmount, x.DueDate, x.SubTotal, x.TaxAmount,
            x.DiscountAmount, x.ShippingCost, x.ExciseDuty, x.TDSAmount, x.TotalAmount,
            x.ApprovalLevel1By, null, x.ApprovalLevel1Date, x.ApprovalLevel1Notes,
            x.ApprovalLevel2By, null, x.ApprovalLevel2Date, x.ApprovalLevel2Notes,
            null, x.Notes, x.CreatedAt,
            x.Items.Select(i => new PurchaseOrderItemDto(
                i.Id, i.ProductId, i.Product.Name, i.Product.SKU ?? "", i.Description,
                i.Quantity, i.Unit ?? "pcs", i.UnitPrice, i.TaxRate, i.TaxAmount,
                i.DiscountPercent, i.DiscountAmount, i.Amount, i.QuantityReceived,
                i.UnitPriceLand, i.BatchNumber, i.ExpiryDate)).ToList(),
            0, 0
        );

        return ApiResponse<PurchaseOrderDto>.SuccessResult(dto);
    }

    public async Task<ApiResponse<bool>> UpdatePurchaseOrderAsync(Guid id, CreatePurchaseOrderDto dto)
    {
        var po = await _context.PurchaseOrders.Include(x => x.Items).FirstOrDefaultAsync(x => x.Id == id);
        if (po == null) return ApiResponse<bool>.FailResult("PO not found");
        if (po.Status != PurchaseOrderStatus.Draft) return ApiResponse<bool>.FailResult("Only draft POs can be updated");

        po.SupplierId = dto.SupplierId;
        po.OrderDate = dto.OrderDate;
        po.ExpectedDelivery = dto.ExpectedDelivery;
        po.Notes = dto.Notes;

        _context.PurchaseOrderItems.RemoveRange(po.Items);

        po.Items = dto.Items.Select(i => new PurchaseOrderItem
        {
            PurchaseOrderId = id,
            ProductId = i.ProductId,
            Description = i.Description,
            Quantity = i.Quantity,
            UnitPrice = i.UnitPrice,
            Amount = i.Quantity * i.UnitPrice
        }).ToList();

        po.SubTotal = po.Items.Sum(x => x.Amount);
        po.TaxAmount = po.SubTotal * 0.13m;
        po.TotalAmount = po.SubTotal + po.TaxAmount;

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> SendPurchaseOrderAsync(Guid id)
    {
        var tenantId = _tenantService.GetTenantId();
        var po = await _context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (po == null) return ApiResponse<bool>.FailResult("PO not found");
        if (po.Status != PurchaseOrderStatus.Draft) return ApiResponse<bool>.FailResult("Invalid status transition");

        // Auto-approve low-value POs (per approval policy) so users can receive immediately.
        if (po.TotalAmount <= 50_000m)
        {
            po.Status = PurchaseOrderStatus.Approved;
            po.ApprovalLevel1By = _currentUser.UserId == Guid.Empty ? null : _currentUser.UserId;
            po.ApprovalLevel1Date = DateTime.UtcNow;
            po.ApprovalLevel1Notes = "Auto-approved (<= 50,000)";
        }
        else
        {
            po.Status = PurchaseOrderStatus.PendingApproval;
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> ReceivePurchaseOrderAsync(Guid id)
    {
        var tenantId = _tenantService.GetTenantId();

        var po = await _context.PurchaseOrders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (po == null) return ApiResponse<bool>.FailResult("PO not found");
        if (po.Status != PurchaseOrderStatus.Approved) return ApiResponse<bool>.FailResult("Only approved POs can be received");

        var defaultWarehouse = await _context.Warehouses
            .Where(w => w.TenantId == tenantId)
            .OrderByDescending(w => w.IsDefault)
            .FirstOrDefaultAsync();
        if (defaultWarehouse == null) return ApiResponse<bool>.FailResult("No warehouse found");

        await using var tx = await _context.Database.BeginTransactionAsync();
        try
        {
            var year = DateTime.UtcNow.Year;
            var count = await _context.GoodsReceipts.IgnoreQueryFilters()
                .CountAsync(x => x.TenantId == tenantId && x.ReceivedDate.Year == year) + 1;
            var receiptNumber = $"GR-{year}-{count:D4}";

            var receipt = new GoodsReceipt
            {
                TenantId = tenantId,
                PurchaseOrderId = po.Id,
                ReceiptNumber = receiptNumber,
                ReceivedDate = DateTime.UtcNow,
                ReceivedBy = _currentUser.UserId == Guid.Empty ? po.CreatedBy : _currentUser.UserId,
                WarehouseId = defaultWarehouse.Id,
                Status = GoodsReceiptStatus.Completed,
                Condition = GoodsReceiptCondition.Good,
                Notes = $"Auto-received from PO: {po.PONumber}"
            };

            var receiptItems = new List<GoodsReceiptItem>();

            foreach (var item in po.Items)
            {
                var receiptItem = new GoodsReceiptItem
                {
                    TenantId = tenantId,
                    GoodsReceiptId = receipt.Id,
                    PurchaseOrderItemId = item.Id,
                    ProductId = item.ProductId,
                    QuantityOrdered = item.Quantity,
                    QuantityReceived = item.Quantity,
                    QuantityDamaged = 0,
                    BatchNumber = item.BatchNumber,
                    ExpiryDate = item.ExpiryDate,
                    Notes = null
                };
                receiptItems.Add(receiptItem);

                var warehouseStock = await _context.WarehouseStocks
                    .FirstOrDefaultAsync(ws => ws.WarehouseId == defaultWarehouse.Id && ws.ProductId == item.ProductId);

                // ReferenceId should point to the persisted GoodsReceipt (or item). We use the receipt.Id to avoid
                // relying on client-side Guid generation behavior for receipt items.
                _context.StockMovements.Add(new StockMovement
                {
                    TenantId = tenantId,
                    ProductId = item.ProductId,
                    WarehouseId = defaultWarehouse.Id,
                    Type = StockMovementType.StockIn,
                    Quantity = item.Quantity,
                    Note = $"Goods receipt: {receiptNumber}",
                    ReferenceType = "GoodsReceipt",
                    ReferenceId = receipt.Id,
                    MovedAt = DateTime.UtcNow
                });

                if (warehouseStock != null)
                {
                    warehouseStock.CurrentStock += item.Quantity;
                    warehouseStock.UpdatedAt = DateTime.UtcNow;
                }
                else
                {
                    _context.WarehouseStocks.Add(new WarehouseStock
                    {
                        TenantId = tenantId,
                        WarehouseId = defaultWarehouse.Id,
                        ProductId = item.ProductId,
                        CurrentStock = item.Quantity
                    });
                }

                item.QuantityReceived += item.Quantity;
            }

            receipt.Items = receiptItems;
            _context.GoodsReceipts.Add(receipt);

            po.Status = PurchaseOrderStatus.GRNComplete;

            await _context.SaveChangesAsync();
            await tx.CommitAsync();

            return ApiResponse<bool>.SuccessResult(true, $"Received and created GRN {receiptNumber}");
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<ApiResponse<bool>> CancelPurchaseOrderAsync(Guid id)
    {
        var po = await _context.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<bool>.FailResult("PO not found");
        if (po.Status == PurchaseOrderStatus.GRNComplete) return ApiResponse<bool>.FailResult("Cannot cancel a fully received PO");

        po.Status = PurchaseOrderStatus.Cancelled;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> DeletePurchaseOrderAsync(Guid id)
    {
        var po = await _context.PurchaseOrders.FindAsync(id);
        if (po == null) return ApiResponse<bool>.FailResult("PO not found");

        po.IsDeleted = true;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<PurchaseAnalyticsDto>> GetPurchaseAnalyticsAsync()
    {
        var tenantId = _tenantService.GetTenantId();
        var month = DateTime.UtcNow.Month;
        var year = DateTime.UtcNow.Year;

        var totalSpend = await _context.PurchaseOrders
            .Where(x => x.Status == PurchaseOrderStatus.GRNComplete && x.OrderDate.Month == month && x.OrderDate.Year == year)
            .SumAsync(x => x.TotalAmount);

        var orderCount = await _context.PurchaseOrders
            .CountAsync(x => x.OrderDate.Month == month && x.OrderDate.Year == year);

        var topSupplier = await _context.PurchaseOrders
            .Include(x => x.Supplier)
            .Where(x => x.Status == PurchaseOrderStatus.GRNComplete)
            .GroupBy(x => x.Supplier.Name)
            .OrderByDescending(g => g.Sum(x => x.TotalAmount))
            .Select(g => g.Key)
            .FirstOrDefaultAsync() ?? "N/A";

        var pendingApprovals = await _context.PurchaseOrders
            .Where(x => x.Status == PurchaseOrderStatus.PendingApproval)
            .SumAsync(x => x.TotalAmount);

        var pendingDeliveries = await _context.PurchaseOrders
            .Where(x => x.Status == PurchaseOrderStatus.Approved)
            .SumAsync(x => x.TotalAmount);

        return ApiResponse<PurchaseAnalyticsDto>.SuccessResult(new PurchaseAnalyticsDto(totalSpend, orderCount, topSupplier, pendingApprovals, pendingDeliveries));
    }

    public async Task<ApiResponse<GoodsReceiptDto>> CreateGoodsReceiptAsync(CreateGoodsReceiptDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var po = await _context.PurchaseOrders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.Id == dto.PurchaseOrderId);

        if (po == null) return ApiResponse<GoodsReceiptDto>.FailResult("Purchase order not found");
        if (po.Status != PurchaseOrderStatus.PendingApproval && po.Status != PurchaseOrderStatus.Approved && po.Status != PurchaseOrderStatus.GRNPartial)
            return ApiResponse<GoodsReceiptDto>.FailResult("PO must be sent or partially received");

        var year = DateTime.UtcNow.Year;
        var count = await _context.GoodsReceipts.IgnoreQueryFilters()
            .CountAsync(x => x.TenantId == tenantId && x.ReceivedDate.Year == year) + 1;
        var receiptNumber = $"GR-{year}-{count:D4}";

        var receipt = new GoodsReceipt
        {
            TenantId = tenantId,
            PurchaseOrderId = dto.PurchaseOrderId,
            ReceiptNumber = receiptNumber,
            ReceivedDate = dto.ReceivedDate,
            Notes = dto.Notes,
            Status = GoodsReceiptStatus.Pending
        };

        var receiptItems = new List<GoodsReceiptItem>();
        var defaultWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.IsDefault) 
            ?? await _context.Warehouses.FirstAsync();

        foreach (var itemDto in dto.Items)
        {
            var poItem = po.Items.FirstOrDefault(i => i.Id == itemDto.PurchaseOrderItemId);
            if (poItem == null) continue;

            var product = await _context.Products.FindAsync(poItem.ProductId);
            var receiptItem = new GoodsReceiptItem
            {
                TenantId = tenantId,
                GoodsReceiptId = receipt.Id,
                PurchaseOrderItemId = itemDto.PurchaseOrderItemId,
                ProductId = poItem.ProductId,
                QuantityOrdered = poItem.Quantity,
                QuantityReceived = itemDto.QuantityReceived,
                QuantityDamaged = 0,
                BatchNumber = poItem.BatchNumber,
                ExpiryDate = poItem.ExpiryDate,
                Notes = itemDto.Notes
            };

            var warehouseStock = await _context.WarehouseStocks
                .FirstOrDefaultAsync(ws => ws.WarehouseId == defaultWarehouse.Id && ws.ProductId == poItem.ProductId);

            var movement = new StockMovement
            {
                TenantId = tenantId,
                ProductId = poItem.ProductId,
                WarehouseId = defaultWarehouse.Id,
                Type = StockMovementType.PurchaseIn,
                Quantity = itemDto.QuantityReceived,
                Note = $"Goods receipt: {receiptNumber}",
                ReferenceType = "GoodsReceipt",
                ReferenceId = receipt.Id,
                MovedAt = DateTime.UtcNow
            };
            _context.StockMovements.Add(movement);

            if (product != null && product.TrackExpiry && poItem.ExpiryDate.HasValue)
            {
                var batchNumber = poItem.BatchNumber ?? $"BCH-{DateTime.UtcNow:yyyy}-{count:D4}";
                var batch = new Batch
                {
                    TenantId = tenantId,
                    ProductId = poItem.ProductId,
                    BatchNumber = batchNumber,
                    ManufactureDate = poItem.ExpiryDate.HasValue ? poItem.ExpiryDate.Value.AddMonths(-6) : null,
                    ExpiryDate = poItem.ExpiryDate,
                    InitialQuantity = itemDto.QuantityReceived,
                    CurrentQuantity = itemDto.QuantityReceived,
                    UnitCost = poItem.UnitPrice,
                    Status = BatchStatus.Active,
                    Notes = $"Created from GRN {receiptNumber}"
                };
                _context.Batches.Add(batch);
                receiptItem.BatchNumber = batchNumber;
            }

            if (warehouseStock != null)
            {
                warehouseStock.CurrentStock += itemDto.QuantityReceived;
                warehouseStock.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                _context.WarehouseStocks.Add(new WarehouseStock
                {
                    TenantId = tenantId,
                    WarehouseId = defaultWarehouse.Id,
                    ProductId = poItem.ProductId,
                    CurrentStock = itemDto.QuantityReceived
                });
            }

            poItem.QuantityReceived += itemDto.QuantityReceived;
            receiptItems.Add(receiptItem);
        }

        receipt.Items = receiptItems;
        _context.GoodsReceipts.Add(receipt);

        var totalReceived = po.Items.Sum(i => i.QuantityReceived);
        var totalOrdered = po.Items.Sum(i => i.Quantity);
        if (totalReceived >= totalOrdered)
            po.Status = PurchaseOrderStatus.GRNComplete;
        else if (totalReceived > 0)
            po.Status = PurchaseOrderStatus.GRNPartial;

        await _context.SaveChangesAsync();

        return await GetGoodsReceiptByIdAsync(receipt.Id);
    }

    public async Task<ApiResponse<List<GoodsReceiptDto>>> GetGoodsReceiptsAsync(Guid? orderId)
    {
        var query = _context.GoodsReceipts
            .Include(r => r.Items)
            .ThenInclude(i => i.Product)
            .AsQueryable();

        if (orderId.HasValue)
            query = query.Where(r => r.PurchaseOrderId == orderId);

        var receipts = await query
            .OrderByDescending(r => r.ReceivedDate)
            .Select(r => new GoodsReceiptDto(
                r.Id, r.PurchaseOrderId, r.PurchaseOrder.PONumber, r.PurchaseOrder.Supplier.Name,
                r.ReceiptNumber, r.ReceivedDate, r.ReceivedBy, "",
                r.WarehouseId, r.Warehouse.Name, r.Status, r.Condition, r.DamageDetails,
                r.Attachments, r.Notes, r.CreatedAt,
                r.Items.Select(i => new GoodsReceiptItemDto(
                    i.Id, i.PurchaseOrderItemId, i.ProductId, i.Product.Name,
                    i.QuantityReceived, i.QuantityReceived, i.QuantityDamaged, i.BatchNumber, i.ExpiryDate, i.Notes)).ToList()))
            .ToListAsync();

        return ApiResponse<List<GoodsReceiptDto>>.SuccessResult(receipts);
    }

    public async Task<ApiResponse<GoodsReceiptDto>> GetGoodsReceiptByIdAsync(Guid id)
    {
        var r = await _context.GoodsReceipts
            .Include(x => x.PurchaseOrder)
            .Include(x => x.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (r == null) return ApiResponse<GoodsReceiptDto>.FailResult("Goods receipt not found");

        var dto = new GoodsReceiptDto(
            r.Id, r.PurchaseOrderId, r.PurchaseOrder.PONumber, r.PurchaseOrder.Supplier.Name,
            r.ReceiptNumber, r.ReceivedDate, r.ReceivedBy, "",
            r.WarehouseId, r.Warehouse.Name, r.Status, r.Condition, r.DamageDetails,
            r.Attachments, r.Notes, r.CreatedAt,
            r.Items.Select(i => new GoodsReceiptItemDto(
                i.Id, i.PurchaseOrderItemId, i.ProductId, i.Product.Name,
                i.QuantityReceived, i.QuantityReceived, i.QuantityDamaged, i.BatchNumber, i.ExpiryDate, i.Notes)).ToList());

        return ApiResponse<GoodsReceiptDto>.SuccessResult(dto);
    }

    public async Task<ApiResponse<PurchaseReturnDto>> CreatePurchaseReturnAsync(CreatePurchaseReturnDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var po = await _context.PurchaseOrders.FindAsync(dto.PurchaseOrderId);

        if (po == null) return ApiResponse<PurchaseReturnDto>.FailResult("Purchase order not found");
        if (po.Status != PurchaseOrderStatus.GRNComplete)
            return ApiResponse<PurchaseReturnDto>.FailResult("Only fully received POs can be returned");

        var year = DateTime.UtcNow.Year;
        var count = await _context.PurchaseReturns.IgnoreQueryFilters()
            .CountAsync(x => x.TenantId == tenantId && x.ReturnDate.Year == year) + 1;
        var returnNumber = $"PR-{year}-{count:D4}";

        var totalAmount = dto.Items.Sum(i => i.Quantity * i.UnitPrice);

        var purchaseReturn = new PurchaseReturn
        {
            TenantId = tenantId,
            PurchaseOrderId = dto.PurchaseOrderId,
            SupplierId = po.SupplierId,
            GoodsReceiptId = dto.GoodsReceiptId,
            ReturnNumber = returnNumber,
            ReturnDate = dto.ReturnDate,
            ReturnType = dto.ReturnType,
            RefundType = dto.RefundType,
            Reason = dto.Reason,
            TotalAmount = totalAmount,
            Status = PurchaseReturnStatus.Pending,
            Notes = dto.Notes
        };

        _context.PurchaseReturns.Add(purchaseReturn);
        await _context.SaveChangesAsync();

        return ApiResponse<PurchaseReturnDto>.SuccessResult(new PurchaseReturnDto(
            purchaseReturn.Id, purchaseReturn.PurchaseOrderId, po.PONumber, po.Supplier.Name,
            null, purchaseReturn.ReturnNumber, purchaseReturn.ReturnDate, purchaseReturn.ReturnType,
            purchaseReturn.TotalAmount, purchaseReturn.Status, purchaseReturn.RefundType, purchaseReturn.Reason,
            null, null, purchaseReturn.Notes, purchaseReturn.CreatedAt, new List<PurchaseReturnItemDto>()));
    }

    public async Task<ApiResponse<List<PurchaseReturnDto>>> GetPurchaseReturnsAsync(Guid? orderId)
    {
        var query = _context.PurchaseReturns
            .Include(r => r.PurchaseOrder)
            .AsQueryable();

        if (orderId.HasValue)
            query = query.Where(r => r.PurchaseOrderId == orderId);

        var returns = await query
            .OrderByDescending(r => r.ReturnDate)
            .Select(r => new PurchaseReturnDto(
                r.Id, r.PurchaseOrderId, r.PurchaseOrder.PONumber, r.PurchaseOrder.Supplier.Name,
                null, r.ReturnNumber, r.ReturnDate, r.ReturnType, r.TotalAmount, r.Status,
                r.RefundType, r.Reason, null, null, r.Notes, r.CreatedAt, 
                r.Items.Select(i => new PurchaseReturnItemDto(
                    i.Id, i.ProductId, i.Product.Name, i.Quantity, i.UnitPrice, i.Amount,
                    i.Reason, i.Condition, i.Resolution)).ToList()))
            .ToListAsync();

        return ApiResponse<List<PurchaseReturnDto>>.SuccessResult(returns);
    }

    public async Task<ApiResponse<bool>> ApprovePurchaseReturnAsync(Guid id)
    {
        var purchaseReturn = await _context.PurchaseReturns.FindAsync(id);
        if (purchaseReturn == null) return ApiResponse<bool>.FailResult("Return not found");
        if (purchaseReturn.Status != PurchaseReturnStatus.Pending)
            return ApiResponse<bool>.FailResult("Invalid status");

        purchaseReturn.Status = PurchaseReturnStatus.Approved;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> RejectPurchaseReturnAsync(Guid id)
    {
        var purchaseReturn = await _context.PurchaseReturns.FindAsync(id);
        if (purchaseReturn == null) return ApiResponse<bool>.FailResult("Return not found");
        if (purchaseReturn.Status != PurchaseReturnStatus.Pending)
            return ApiResponse<bool>.FailResult("Invalid status");

        purchaseReturn.Status = PurchaseReturnStatus.Rejected;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<List<SupplierDto>>> GetSuppliersAsync(string? search, bool? isActive)
    {
        var tenantId = _tenantService.GetTenantId();
        var query = _context.Contacts.Where(c => c.TenantId == tenantId && c.Type == ContactType.Supplier);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(c => c.Name.Contains(search) || c.Phone.Contains(search) || (c.PANNumber != null && c.PANNumber.Contains(search)));
        
        if (isActive.HasValue)
            query = query.Where(c => c.IsActive == isActive);

        var suppliers = await query.Select(c => new SupplierDto(
            c.Id, c.Code ?? "", c.Name, SupplierType.Trader, c.ContactPerson ?? "", null,
            c.Phone ?? "", null, c.Email, null, c.PANNumber, c.VATNumber,
            c.Address ?? "", c.City, null, PaymentType.COD, 0, 0,
            PaymentRecordMethod.BankTransfer, null, null, null, false, 1.5m,
            BizCore.Domain.Enums.VATCategory.Unregistered, false, 3, null, null, c.IsActive, c.CreatedAt
        )).ToListAsync();

        return ApiResponse<List<SupplierDto>>.SuccessResult(suppliers);
    }

    public async Task<ApiResponse<SupplierDto>> GetSupplierByIdAsync(Guid id)
    {
        var tenantId = _tenantService.GetTenantId();
        var c = await _context.Contacts.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (c == null) return ApiResponse<SupplierDto>.FailResult("Supplier not found");

        return ApiResponse<SupplierDto>.SuccessResult(new SupplierDto(
            c.Id, c.Code ?? "", c.Name, SupplierType.Trader, c.ContactPerson ?? "", null,
            c.Phone ?? "", null, c.Email, null, c.PANNumber, c.VATNumber,
            c.Address ?? "", c.City, null, PaymentType.COD, 0, 0,
            PaymentRecordMethod.BankTransfer, null, null, null, false, 1.5m,
            BizCore.Domain.Enums.VATCategory.Unregistered, false, 3, null, null, c.IsActive, c.CreatedAt
        ));
    }

    public async Task<ApiResponse<SupplierDto>> CreateSupplierAsync(CreateSupplierDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var count = await _context.Contacts.CountAsync(c => c.TenantId == tenantId && c.Type == ContactType.Supplier) + 1;
        var code = $"SUP-{count:D4}";

        var supplier = new Contact
        {
            TenantId = tenantId,
            Code = code,
            Name = dto.CompanyName,
            Type = ContactType.Supplier,
            ContactPerson = dto.ContactPerson,
            Phone = dto.PrimaryPhone,
            Email = dto.Email,
            Address = dto.Address,
            City = dto.City,
            PANNumber = dto.PANNumber,
            VATNumber = dto.VATNumber,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Contacts.Add(supplier);
        await _context.SaveChangesAsync();

        return await GetSupplierByIdAsync(supplier.Id);
    }

    public async Task<ApiResponse<SupplierDto>> UpdateSupplierAsync(Guid id, UpdateSupplierDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var supplier = await _context.Contacts.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (supplier == null) return ApiResponse<SupplierDto>.FailResult("Supplier not found");

        supplier.Name = dto.CompanyName;
        supplier.ContactPerson = dto.ContactPerson;
        supplier.Phone = dto.PrimaryPhone;
        supplier.Email = dto.Email;
        supplier.Address = dto.Address;
        supplier.City = dto.City;
        supplier.PANNumber = dto.PANNumber;
        supplier.VATNumber = dto.VATNumber;
        supplier.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return await GetSupplierByIdAsync(id);
    }

    public async Task<ApiResponse<bool>> DeleteSupplierAsync(Guid id)
    {
        var tenantId = _tenantService.GetTenantId();
        var supplier = await _context.Contacts.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (supplier == null) return ApiResponse<bool>.FailResult("Supplier not found");

        var hasOrders = await _context.PurchaseOrders.AnyAsync(x => x.SupplierId == id);
        if (hasOrders) return ApiResponse<bool>.FailResult("Cannot delete supplier with existing orders");

        supplier.IsActive = false;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<decimal>> GetSupplierBalanceAsync(Guid supplierId)
    {
        var tenantId = _tenantService.GetTenantId();
        var pos = await _context.PurchaseOrders.Where(x => x.SupplierId == supplierId && x.TenantId == tenantId).ToListAsync();
        var payments = await _context.Set<Payment>().Where(x => x.PurchaseOrder.SupplierId == supplierId && x.TenantId == tenantId).ToListAsync();

        var totalOrders = pos.Sum(x => x.TotalAmount);
        var totalPayments = payments.Sum(x => x.Amount);
        return ApiResponse<decimal>.SuccessResult(totalOrders - totalPayments);
    }

    public async Task<ApiResponse<bool>> SubmitPurchaseOrderAsync(Guid id)
    {
        var tenantId = _tenantService.GetTenantId();
        var po = await _context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (po == null) return ApiResponse<bool>.FailResult("PO not found");
        if (po.Status != PurchaseOrderStatus.Draft) return ApiResponse<bool>.FailResult("Only draft POs can be submitted");

        // Auto-approve low-value POs (per approval policy) so users can receive immediately.
        if (po.TotalAmount <= 50_000m)
        {
            po.Status = PurchaseOrderStatus.Approved;
            po.ApprovalLevel1By = _currentUser.UserId == Guid.Empty ? null : _currentUser.UserId;
            po.ApprovalLevel1Date = DateTime.UtcNow;
            po.ApprovalLevel1Notes = "Auto-approved (<= 50,000)";
        }
        else
        {
            po.Status = PurchaseOrderStatus.PendingApproval;
        }

        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> ApprovePurchaseOrderAsync(Guid id, string? notes)
    {
        var tenantId = _tenantService.GetTenantId();
        var po = await _context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (po == null) return ApiResponse<bool>.FailResult("PO not found");
        if (po.Status != PurchaseOrderStatus.PendingApproval) return ApiResponse<bool>.FailResult("PO is not pending approval");

        po.Status = PurchaseOrderStatus.Approved;
        po.ApprovalLevel1By = _currentUser.UserId == Guid.Empty ? null : _currentUser.UserId;
        po.ApprovalLevel1Date = DateTime.UtcNow;
        po.ApprovalLevel1Notes = notes;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<bool>> RejectPurchaseOrderAsync(Guid id, string notes)
    {
        var tenantId = _tenantService.GetTenantId();
        var po = await _context.PurchaseOrders.FirstOrDefaultAsync(x => x.Id == id && x.TenantId == tenantId);
        if (po == null) return ApiResponse<bool>.FailResult("PO not found");
        if (po.Status != PurchaseOrderStatus.PendingApproval) return ApiResponse<bool>.FailResult("PO is not pending approval");

        po.Status = PurchaseOrderStatus.Rejected;
        po.ApprovalLevel1By = _currentUser.UserId == Guid.Empty ? null : _currentUser.UserId;
        po.ApprovalLevel1Date = DateTime.UtcNow;
        po.ApprovalLevel1Notes = notes;
        await _context.SaveChangesAsync();
        return ApiResponse<bool>.SuccessResult(true);
    }

    public async Task<ApiResponse<List<PurchaseOrderDto>>> GetPendingApprovalOrdersAsync()
    {
        var tenantId = _tenantService.GetTenantId();
        var pos = await _context.PurchaseOrders
            .Include(x => x.Supplier)
            .Where(x => x.TenantId == tenantId && x.Status == PurchaseOrderStatus.PendingApproval)
            .OrderByDescending(x => x.OrderDate)
            .Select(x => new PurchaseOrderDto(
                x.Id, x.PONumber, x.SupplierId, x.Supplier.Name, x.Supplier.Phone ?? "", x.Supplier.PANNumber,
                x.Status, x.OrderDate, x.ExpectedDelivery, x.ReferenceNumber, x.DeliveryWarehouseId,
                null, x.DeliveryAddress, OrderType.Regular, Priority.Normal, null, Currency.NPR,
                x.ExchangeRate, x.PaymentType, x.AdvanceAmount, x.DueDate, x.SubTotal, x.TaxAmount,
                x.DiscountAmount, x.ShippingCost, x.ExciseDuty, x.TDSAmount, x.TotalAmount,
                x.ApprovalLevel1By, null, x.ApprovalLevel1Date, x.ApprovalLevel1Notes,
                x.ApprovalLevel2By, null, x.ApprovalLevel2Date, x.ApprovalLevel2Notes,
                null, x.Notes, x.CreatedAt,
                new List<PurchaseOrderItemDto>(), 0, 0))
            .ToListAsync();
        return ApiResponse<List<PurchaseOrderDto>>.SuccessResult(pos);
    }

    public async Task<ApiResponse<PaymentDto>> CreatePaymentAsync(CreatePaymentDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var po = await _context.PurchaseOrders
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == dto.PurchaseOrderId);
        if (po == null) return ApiResponse<PaymentDto>.FailResult("PO not found");

        var count = await _context.Set<Payment>().CountAsync(x => x.TenantId == tenantId) + 1;
        var paymentNumber = $"PAY-{DateTime.UtcNow.Year}-{count:D4}";

        var payment = new Payment
        {
            TenantId = tenantId,
            PaymentNumber = paymentNumber,
            PurchaseOrderId = dto.PurchaseOrderId,
            PaymentDate = dto.PaymentDate,
            Amount = dto.Amount,
            PaymentMethod = dto.PaymentMethod,
            ReferenceNumber = dto.ReferenceNumber,
            BankAccountId = dto.BankAccountId,
            TDSDeducted = dto.TDSDeducted,
            TDSCertificateNo = dto.TDSCertificateNo,
            TDSCertificateDate = dto.TDSCertificateDate,
            Status = PaymentStatus.Paid,
            Notes = dto.Notes,
            CreatedBy = Guid.Empty
        };

        _context.Set<Payment>().Add(payment);
        await _context.SaveChangesAsync();

        return ApiResponse<PaymentDto>.SuccessResult(new PaymentDto(
            payment.Id, payment.PaymentNumber, payment.PurchaseOrderId, po.PONumber, po.Supplier.Name,
            payment.PaymentDate, payment.Amount, payment.PaymentMethod, payment.ReferenceNumber,
            payment.BankAccountId, null, payment.TDSDeducted, payment.TDSCertificateNo, payment.TDSCertificateDate,
            payment.Status, payment.Notes, payment.CreatedAt
        ));
    }

    public async Task<ApiResponse<List<PaymentDto>>> GetPaymentsAsync(Guid? orderId)
    {
        var query = _context.Set<Payment>()
            .Include(x => x.PurchaseOrder)
            .ThenInclude(p => p.Supplier)
            .AsQueryable();
        if (orderId.HasValue) query = query.Where(x => x.PurchaseOrderId == orderId);

        var payments = await query.OrderByDescending(x => x.PaymentDate)
            .Select(x => new PaymentDto(
                x.Id, x.PaymentNumber, x.PurchaseOrderId, x.PurchaseOrder.PONumber, x.PurchaseOrder.Supplier.Name,
                x.PaymentDate, x.Amount, x.PaymentMethod, x.ReferenceNumber,
                x.BankAccountId, null, x.TDSDeducted, x.TDSCertificateNo, x.TDSCertificateDate,
                x.Status, x.Notes, x.CreatedAt)).ToListAsync();
        return ApiResponse<List<PaymentDto>>.SuccessResult(payments);
    }

    public async Task<ApiResponse<PaymentDto>> GetPaymentByIdAsync(Guid id)
    {
        var payment = await _context.Set<Payment>()
            .Include(x => x.PurchaseOrder)
            .ThenInclude(p => p.Supplier)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (payment == null) return ApiResponse<PaymentDto>.FailResult("Payment not found");

        return ApiResponse<PaymentDto>.SuccessResult(new PaymentDto(
            payment.Id, payment.PaymentNumber, payment.PurchaseOrderId, payment.PurchaseOrder.PONumber, payment.PurchaseOrder.Supplier.Name,
            payment.PaymentDate, payment.Amount, payment.PaymentMethod, payment.ReferenceNumber,
            payment.BankAccountId, null, payment.TDSDeducted, payment.TDSCertificateNo, payment.TDSCertificateDate,
            payment.Status, payment.Notes, payment.CreatedAt
        ));
    }

    public async Task<ApiResponse<List<PaymentDto>>> GetPaymentsForOrderAsync(Guid orderId)
    {
        return await GetPaymentsAsync(orderId);
    }

    public async Task<ApiResponse<PurchaseReturnDto>> GetPurchaseReturnByIdAsync(Guid id)
    {
        var r = await _context.PurchaseReturns
            .Include(x => x.PurchaseOrder)
            .ThenInclude(p => p.Supplier)
            .Include(x => x.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(x => x.Id == id);
        if (r == null) return ApiResponse<PurchaseReturnDto>.FailResult("Return not found");

        return ApiResponse<PurchaseReturnDto>.SuccessResult(new PurchaseReturnDto(
            r.Id, r.PurchaseOrderId, r.PurchaseOrder.PONumber, r.PurchaseOrder.Supplier.Name, null,
            r.ReturnNumber, r.ReturnDate, r.ReturnType, r.TotalAmount, r.Status,
            r.RefundType, r.Reason, null, null, r.Notes, r.CreatedAt, 
            r.Items.Select(i => new PurchaseReturnItemDto(
                i.Id, i.ProductId, i.Product.Name, i.Quantity, i.UnitPrice, i.Amount,
                i.Reason, i.Condition, i.Resolution)).ToList()
        ));
    }

    public async Task<ApiResponse<PurchaseSummaryReportDto>> GetPurchaseSummaryAsync(DateTime fromDate, DateTime toDate)
    {
        var tenantId = _tenantService.GetTenantId();
        var pos = await _context.PurchaseOrders.Where(x => x.TenantId == tenantId && x.OrderDate >= fromDate && x.OrderDate <= toDate).ToListAsync();

        return ApiResponse<PurchaseSummaryReportDto>.SuccessResult(new PurchaseSummaryReportDto(
            fromDate, toDate, pos.Count, pos.Sum(x => x.TotalAmount), pos.Sum(x => x.TaxAmount),
            0, pos.Count > 0 ? pos.Sum(x => x.TotalAmount) / pos.Count : 0,
            new List<SupplierPurchaseSummary>(), new List<MonthlyPurchaseTrend>()
        ));
    }

    public async Task<ApiResponse<SupplierLedgerDto>> GetSupplierLedgerAsync(Guid supplierId, DateTime fromDate, DateTime toDate)
    {
        var tenantId = _tenantService.GetTenantId();
        var supplier = await _context.Contacts.FirstOrDefaultAsync(c => c.Id == supplierId);
        var pos = await _context.PurchaseOrders.Where(x => x.SupplierId == supplierId && x.OrderDate >= fromDate && x.OrderDate <= toDate).ToListAsync();
        var payments = await _context.Set<Payment>()
            .Include(p => p.PurchaseOrder)
            .Where(x => x.PurchaseOrder.SupplierId == supplierId && x.PaymentDate >= fromDate && x.PaymentDate <= toDate)
            .ToListAsync();

        var entries = new List<SupplierLedgerEntry>();
        
        // Add PO entries
        foreach (var po in pos)
        {
            entries.Add(new SupplierLedgerEntry(po.OrderDate, po.PONumber, "Purchase", po.TotalAmount, 0, 0));
        }
        
        foreach (var p in payments)
        {
            entries.Add(new SupplierLedgerEntry(p.PaymentDate, p.PaymentNumber, "Payment", 0, p.Amount, 0));
        }

        var openingBalance = 0m;
        var totalPurchases = pos.Sum(x => x.TotalAmount);
        var totalPayments = payments.Sum(x => x.Amount);
        var closingBalance = totalPurchases - totalPayments;

        return ApiResponse<SupplierLedgerDto>.SuccessResult(new SupplierLedgerDto(
            supplierId, supplier?.Name ?? "", supplier?.PANNumber, openingBalance, totalPurchases, 
            totalPayments, 0, closingBalance, entries.OrderBy(e => e.Date).ToList()
        ));
    }

    public async Task<ApiResponse<TaxReportDto>> GetTaxReportAsync(DateTime fromDate, DateTime toDate)
    {
        var tenantId = _tenantService.GetTenantId();
        var pos = await _context.PurchaseOrders.Where(x => x.TenantId == tenantId && x.OrderDate >= fromDate && x.OrderDate <= toDate).ToListAsync();
        var payments = await _context.Set<Payment>().Where(x => x.TenantId == tenantId && x.PaymentDate >= fromDate && x.PaymentDate <= toDate).ToListAsync();

        return ApiResponse<TaxReportDto>.SuccessResult(new TaxReportDto(
            fromDate, toDate, pos.Sum(x => x.TotalAmount), pos.Sum(x => x.TaxAmount),
            payments.Sum(x => x.TDSDeducted ?? 0), new List<TaxEntry>()
        ));
    }
}
