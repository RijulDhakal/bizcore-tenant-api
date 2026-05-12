namespace BizCore.Domain.Entities;

public class Business : BaseEntity
{
    public Guid TenantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? LegalName { get; set; }
    public string BusinessType { get; set; } = "Other";
    public string? IndustryCategory { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? AlternatePhone { get; set; }
    public string? Address { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; } = "Nepal";
    public string? MapsLocation { get; set; }
    public string? PANNumber { get; set; }
    public bool IsVATRegistered { get; set; } = false;
    public string? VATNumber { get; set; }
    public string? RegistrationNumber { get; set; }
    public DateTime? RegistrationDate { get; set; }
    public string? TaxpayerType { get; set; }
    public string? NICCode { get; set; }
    public string? MSMECategory { get; set; }
    public string DefaultCurrency { get; set; } = "NPR";
    public string FiscalYearStart { get; set; } = "Shrawan";
    public string? DateFormat { get; set; } = "YYYY-MM-DD";
    public string? TimeZone { get; set; } = "Asia/Kathmandu";
    public string? LogoUrl { get; set; }
    public string? Website { get; set; }
    public string? Description { get; set; }
    public string? DefaultWarehouseName { get; set; }
    public string? InvoicePrefix { get; set; }
    public string? Language { get; set; } = "English";
    public bool EnableInventory { get; set; } = true;
    
    // Banking
    public string? BankName { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankAccountName { get; set; }
    public string? BankBranch { get; set; }

    public string Status { get; set; } = "ACTIVE";
    public Guid? OwnerId { get; set; }
    
    [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
    public string OnboardingStatus { get; set; } = "{}";

    public ApplicationUser Owner { get; set; } = null!;
    public ICollection<Branch> Branches { get; set; } = new List<Branch>();
    public ICollection<UserBusiness> UserBusinesses { get; set; } = new List<UserBusiness>();
}
