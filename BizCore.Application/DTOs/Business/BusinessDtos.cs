namespace BizCore.Application.DTOs.Business;

public class BusinessDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string BusinessType { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? PANNumber { get; set; }
    public bool IsVATRegistered { get; set; }
    public string? VATNumber { get; set; }
    public string DefaultCurrency { get; set; } = "NPR";
    public string FiscalYearStart { get; set; } = "Shrawan";
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? OnboardingStatus { get; set; }
}

public class CreateBusinessDto
{
    public string Name { get; set; } = string.Empty;
    public string BusinessType { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string City { get; set; } = string.Empty;
    public string? District { get; set; }
    public string? PANNumber { get; set; }
    public bool IsVATRegistered { get; set; }
    public string? VATNumber { get; set; }
    public string DefaultCurrency { get; set; } = "NPR";
    public string FiscalYearStart { get; set; } = "Shrawan";
    public string? Website { get; set; }
    public string? Description { get; set; }
}

public class CreateBusinessResponseDto
{
    public BusinessDto Business { get; set; } = null!;
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class UpdateBusinessDto
{
    public string? Name { get; set; }
    public string? BusinessType { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? PANNumber { get; set; }
    public bool? IsVATRegistered { get; set; }
    public string? VATNumber { get; set; }
    public string? DefaultCurrency { get; set; }
    public string? FiscalYearStart { get; set; }
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? Description { get; set; }
}

public class BranchDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public bool IsMain { get; set; }
}

public class CreateBranchDto
{
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
}
