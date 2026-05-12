namespace BizCore.Application.DTOs.Tenants;

public sealed record TenantListItemDto(
    Guid TenantId,
    string Name,
    DateTime? CreatedAt = null);

public sealed record TenantProfileDto(
    Guid TenantId,
    Guid? BusinessId,
    Guid? OwnerId,
    string Name,
    string? Email = null,
    string? Phone = null,
    string? OnboardingStatusJson = null);

public sealed record UpdateTenantProfileDto(
    string? Name = null,
    string? LegalName = null,
    string? BusinessType = null,
    string? Email = null,
    string? Phone = null,
    string? AlternatePhone = null,
    string? Website = null,
    string? Description = null,
    string? Address = null,
    string? AddressLine2 = null,
    string? City = null,
    string? District = null,
    string? Province = null,
    string? PostalCode = null,
    string? Country = null,
    string? PANNumber = null,
    bool? IsVATRegistered = null,
    string? VATNumber = null);
