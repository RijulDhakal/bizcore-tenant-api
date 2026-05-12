using BizCore.Application.DTOs.Inventory;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Domain.Enums;
using BizCore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Application.Services;

public class DamagedGoodsService : IDamagedGoodsService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public DamagedGoodsService(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<DamagedGoodsDto> CreateAsync(CreateDamagedGoodsDto dto, string reportedBy)
    {
        var tenantId = _tenantService.GetTenantId();

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null)
            throw new InvalidOperationException("Product not found.");

        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == dto.WarehouseId);
        if (warehouse == null)
            throw new InvalidOperationException("Warehouse not found.");

        if (dto.Quantity <= 0)
            throw new InvalidOperationException("Quantity must be greater than zero.");

        var warehouseStock = await _context.WarehouseStocks
            .FirstOrDefaultAsync(ws => ws.WarehouseId == dto.WarehouseId && ws.ProductId == dto.ProductId);

        if (warehouseStock == null || dto.Quantity > warehouseStock.CurrentStock)
            throw new InvalidOperationException("Damaged quantity cannot exceed current stock.");

        warehouseStock.CurrentStock -= dto.Quantity;
        warehouseStock.UpdatedAt = DateTime.UtcNow;

        var damaged = new DamagedGoods
        {
            TenantId = tenantId,
            ProductId = dto.ProductId,
            WarehouseId = dto.WarehouseId,
            Quantity = dto.Quantity,
            EstimatedLoss = dto.EstimatedLoss,
            Reason = dto.Reason,
            DamageType = dto.DamageType,
            ReportedDate = dto.ReportedDate,
            ReportedBy = reportedBy,
            Notes = dto.Notes,
            Status = DamagedGoodsStatus.Pending,
        };

        _context.DamagedGoods.Add(damaged);

        _context.StockMovements.Add(new StockMovement
        {
            TenantId = tenantId,
            ProductId = dto.ProductId,
            WarehouseId = dto.WarehouseId,
            Type = StockMovementType.StockOut,
            Quantity = dto.Quantity,
            ReferenceType = "DamagedGoods",
            ReferenceId = damaged.Id,
            Note = "Damaged: " + dto.Reason,
            MovedAt = DateTime.UtcNow,
        });

        await _context.SaveChangesAsync();

        return await GetByIdOrThrowAsync(damaged.Id);
    }

    public async Task<List<DamagedGoodsDto>> GetAllAsync(DateTime? dateFrom, DateTime? dateTo, string? status)
    {
        var query = _context.DamagedGoods
            .Include(x => x.Product)
            .Include(x => x.Warehouse)
            .AsQueryable();

        if (dateFrom.HasValue)
            query = query.Where(x => x.ReportedDate >= dateFrom.Value);
        if (dateTo.HasValue)
            query = query.Where(x => x.ReportedDate <= dateTo.Value);

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DamagedGoodsStatus>(status, true, out var parsed))
            query = query.Where(x => x.Status == parsed);

        return await query
            .OrderByDescending(x => x.ReportedDate)
            .Select(MapToDtoExpression())
            .ToListAsync();
    }

    public async Task<DamagedGoodsDto> ApproveAsync(Guid id, string approvedBy)
    {
        var item = await _context.DamagedGoods.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null)
            throw new InvalidOperationException("Damaged goods record not found.");

        item.Status = DamagedGoodsStatus.Approved;
        item.ApprovedBy = approvedBy;
        item.ApprovedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetByIdOrThrowAsync(id);
    }

    public async Task<DamagedGoodsDto> WriteOffAsync(Guid id)
    {
        var item = await _context.DamagedGoods.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null)
            throw new InvalidOperationException("Damaged goods record not found.");

        item.Status = DamagedGoodsStatus.WrittenOff;
        await _context.SaveChangesAsync();
        return await GetByIdOrThrowAsync(id);
    }

    public async Task DeleteAsync(Guid id)
    {
        var item = await _context.DamagedGoods.FirstOrDefaultAsync(x => x.Id == id);
        if (item == null)
            throw new InvalidOperationException("Damaged goods record not found.");

        item.IsDeleted = true;
        await _context.SaveChangesAsync();
    }

    public async Task<DamagedGoodsSummaryDto> GetSummaryAsync()
    {
        var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);

        var monthQuery = _context.DamagedGoods.Where(x => x.ReportedDate >= monthStart);

        var totalLoss = await monthQuery.SumAsync(x => (decimal?)x.EstimatedLoss) ?? 0;
        var pending = await monthQuery.CountAsync(x => x.Status == DamagedGoodsStatus.Pending);
        var writtenOff = await monthQuery.CountAsync(x => x.Status == DamagedGoodsStatus.WrittenOff);

        var mostAffected = await monthQuery
            .GroupBy(x => x.Product.Name)
            .OrderByDescending(g => g.Sum(x => x.Quantity))
            .Select(g => g.Key)
            .FirstOrDefaultAsync();

        return new DamagedGoodsSummaryDto
        {
            TotalLossThisMonth = totalLoss,
            PendingCount = pending,
            WrittenOffCount = writtenOff,
            MostAffectedProduct = mostAffected,
        };
    }

    private async Task<DamagedGoodsDto> GetByIdOrThrowAsync(Guid id)
    {
        var item = await _context.DamagedGoods
            .Include(x => x.Product)
            .Include(x => x.Warehouse)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (item == null)
            throw new InvalidOperationException("Damaged goods record not found.");

        return new DamagedGoodsDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductName = item.Product.Name,
            WarehouseName = item.Warehouse.Name,
            Quantity = item.Quantity,
            EstimatedLoss = item.EstimatedLoss,
            Reason = item.Reason,
            DamageType = item.DamageType,
            ReportedDate = item.ReportedDate,
            ReportedBy = item.ReportedBy,
            Notes = item.Notes,
            Status = item.Status.ToString(),
            ApprovedBy = item.ApprovedBy,
            ApprovedAt = item.ApprovedAt,
            CreatedAt = item.CreatedAt,
        };
    }

    private static System.Linq.Expressions.Expression<Func<DamagedGoods, DamagedGoodsDto>> MapToDtoExpression()
    {
        return item => new DamagedGoodsDto
        {
            Id = item.Id,
            ProductId = item.ProductId,
            ProductName = item.Product.Name,
            WarehouseName = item.Warehouse.Name,
            Quantity = item.Quantity,
            EstimatedLoss = item.EstimatedLoss,
            Reason = item.Reason,
            DamageType = item.DamageType,
            ReportedDate = item.ReportedDate,
            ReportedBy = item.ReportedBy,
            Notes = item.Notes,
            Status = item.Status.ToString(),
            ApprovedBy = item.ApprovedBy,
            ApprovedAt = item.ApprovedAt,
            CreatedAt = item.CreatedAt,
        };
    }
}
