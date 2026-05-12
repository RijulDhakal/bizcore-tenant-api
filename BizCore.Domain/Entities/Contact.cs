using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class Contact : TenantEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? BusinessName { get; set; }
    public string? ContactPerson { get; set; }
    public string? PANNumber { get; set; }
    public string? VATNumber { get; set; }
    public string? Phone { get; set; }
    public string? LandlinePhone { get; set; }
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public ContactType Type { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public string? DefaultPaymentTerms { get; set; } = "NET0";
    public decimal CustomerCreditLimit { get; set; } = 0;
    public int CustomerCreditDays { get; set; } = 30;
    public decimal CustomerOpeningBalance { get; set; } = 0;
    public decimal SupplierCreditLimit { get; set; } = 0;
    public int SupplierCreditDays { get; set; } = 30;
    public decimal SupplierOpeningBalance { get; set; } = 0;
    
    public decimal CustomerCurrentBalance { get; set; } = 0;
    public decimal SupplierCurrentBalance { get; set; } = 0;
}
