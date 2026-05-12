using BizCore.Application.DTOs;
using BizCore.Application.Interfaces;
using BizCore.Domain.Entities;
using BizCore.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BizCore.Infrastructure.Application.Services;

public class MerchantService : IMerchantService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public MerchantService(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<MerchantDto>> GetAllAsync()
    {
        return await _context.Merchants
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new MerchantDto(
                x.Id, x.Name, x.ContactPerson, x.Phone, x.Email, x.Address, 
                x.DefaultCommissionRate, x.IsActive, x.Notes, x.CreatedAt))
            .ToListAsync();
    }

    public async Task<MerchantDto?> GetByIdAsync(Guid id)
    {
        var x = await _context.Merchants.FirstOrDefaultAsync(m => m.Id == id);
        return x == null ? null : new MerchantDto(
            x.Id, x.Name, x.ContactPerson, x.Phone, x.Email, x.Address, 
            x.DefaultCommissionRate, x.IsActive, x.Notes, x.CreatedAt);
    }

    public async Task<MerchantDto> CreateAsync(CreateMerchantDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var merchant = new Merchant
        {
            TenantId = tenantId,
            Name = dto.Name,
            ContactPerson = dto.ContactPerson,
            Phone = dto.Phone,
            Email = dto.Email,
            Address = dto.Address,
            DefaultCommissionRate = dto.DefaultCommissionRate,
            Notes = dto.Notes,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Merchants.Add(merchant);
        await _context.SaveChangesAsync();
        return new MerchantDto(
            merchant.Id, merchant.Name, merchant.ContactPerson, merchant.Phone, merchant.Email, 
            merchant.Address, merchant.DefaultCommissionRate, merchant.IsActive, merchant.Notes, merchant.CreatedAt);
    }

    public async Task<MerchantDto> UpdateAsync(Guid id, UpdateMerchantDto dto)
    {
        var item = await _context.Merchants.FirstOrDefaultAsync(x => x.Id == id) 
            ?? throw new InvalidOperationException("Merchant not found");

        item.Name = dto.Name;
        item.ContactPerson = dto.ContactPerson;
        item.Phone = dto.Phone;
        item.Email = dto.Email;
        item.Address = dto.Address;
        item.DefaultCommissionRate = dto.DefaultCommissionRate;
        item.IsActive = dto.IsActive;
        item.Notes = dto.Notes;

        await _context.SaveChangesAsync();
        return new MerchantDto(
            item.Id, item.Name, item.ContactPerson, item.Phone, item.Email, 
            item.Address, item.DefaultCommissionRate, item.IsActive, item.Notes, item.CreatedAt);
    }

    public async Task DeleteAsync(Guid id)
    {
        var item = await _context.Merchants.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new InvalidOperationException("Merchant not found");
        item.IsDeleted = true;
        await _context.SaveChangesAsync();
    }
}

public class DeliveryPartnerService : IDeliveryPartnerService
{
    private readonly AppDbContext _context;
    private readonly ITenantService _tenantService;

    public DeliveryPartnerService(AppDbContext context, ITenantService tenantService)
    {
        _context = context;
        _tenantService = tenantService;
    }

    public async Task<List<DeliveryPartnerDto>> GetAllAsync()
    {
        return await _context.DeliveryPartners
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new DeliveryPartnerDto(
                x.Id, x.Name, x.Type, x.ContactPhone, x.DefaultDeliveryFee, x.IsActive, x.CreatedAt))
            .ToListAsync();
    }

    public async Task<DeliveryPartnerDto?> GetByIdAsync(Guid id)
    {
        var x = await _context.DeliveryPartners.FirstOrDefaultAsync(d => d.Id == id);
        return x == null ? null : new DeliveryPartnerDto(
            x.Id, x.Name, x.Type, x.ContactPhone, x.DefaultDeliveryFee, x.IsActive, x.CreatedAt);
    }

    public async Task<DeliveryPartnerDto> CreateAsync(CreateDeliveryPartnerDto dto)
    {
        var tenantId = _tenantService.GetTenantId();
        var partner = new DeliveryPartner
        {
            TenantId = tenantId,
            Name = dto.Name,
            Type = dto.Type,
            ContactPhone = dto.ContactPhone,
            DefaultDeliveryFee = dto.DefaultDeliveryFee,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.DeliveryPartners.Add(partner);
        await _context.SaveChangesAsync();
        return new DeliveryPartnerDto(
            partner.Id, partner.Name, partner.Type, partner.ContactPhone, partner.DefaultDeliveryFee, partner.IsActive, partner.CreatedAt);
    }

    public async Task<DeliveryPartnerDto> UpdateAsync(Guid id, UpdateDeliveryPartnerDto dto)
    {
        var item = await _context.DeliveryPartners.FirstOrDefaultAsync(x => x.Id == id) 
            ?? throw new InvalidOperationException("DeliveryPartner not found");

        item.Name = dto.Name;
        item.Type = dto.Type;
        item.ContactPhone = dto.ContactPhone;
        item.DefaultDeliveryFee = dto.DefaultDeliveryFee;
        item.IsActive = dto.IsActive;

        await _context.SaveChangesAsync();
        return new DeliveryPartnerDto(
            item.Id, item.Name, item.Type, item.ContactPhone, item.DefaultDeliveryFee, item.IsActive, item.CreatedAt);
    }

    public async Task DeleteAsync(Guid id)
    {
        var item = await _context.DeliveryPartners.FirstOrDefaultAsync(x => x.Id == id)
            ?? throw new InvalidOperationException("DeliveryPartner not found");
        item.IsDeleted = true;
        await _context.SaveChangesAsync();
    }
}
