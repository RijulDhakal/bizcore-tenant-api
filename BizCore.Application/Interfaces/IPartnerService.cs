using BizCore.Application.DTOs;

namespace BizCore.Application.Interfaces;

public interface IMerchantService
{
    Task<List<MerchantDto>> GetAllAsync();
    Task<MerchantDto?> GetByIdAsync(Guid id);
    Task<MerchantDto> CreateAsync(CreateMerchantDto dto);
    Task<MerchantDto> UpdateAsync(Guid id, UpdateMerchantDto dto);
    Task DeleteAsync(Guid id);
}

public interface IDeliveryPartnerService
{
    Task<List<DeliveryPartnerDto>> GetAllAsync();
    Task<DeliveryPartnerDto?> GetByIdAsync(Guid id);
    Task<DeliveryPartnerDto> CreateAsync(CreateDeliveryPartnerDto dto);
    Task<DeliveryPartnerDto> UpdateAsync(Guid id, UpdateDeliveryPartnerDto dto);
    Task DeleteAsync(Guid id);
}
