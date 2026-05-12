namespace BizCore.Application.DTOs;

public record MerchantDto(
    Guid Id,
    string Name,
    string? ContactPerson,
    string Phone,
    string? Email,
    string? Address,
    decimal DefaultCommissionRate,
    bool IsActive,
    string? Notes,
    DateTime CreatedAt
);

public record CreateMerchantDto(
    string Name,
    string? ContactPerson,
    string Phone,
    string? Email,
    string? Address,
    decimal DefaultCommissionRate,
    string? Notes
);

public record UpdateMerchantDto(
    string Name,
    string? ContactPerson,
    string Phone,
    string? Email,
    string? Address,
    decimal DefaultCommissionRate,
    bool IsActive,
    string? Notes
);

public record DeliveryPartnerDto(
    Guid Id,
    string Name,
    string Type,
    string? ContactPhone,
    decimal DefaultDeliveryFee,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateDeliveryPartnerDto(
    string Name,
    string Type,
    string? ContactPhone,
    decimal DefaultDeliveryFee
);

public record UpdateDeliveryPartnerDto(
    string Name,
    string Type,
    string? ContactPhone,
    decimal DefaultDeliveryFee,
    bool IsActive
);
