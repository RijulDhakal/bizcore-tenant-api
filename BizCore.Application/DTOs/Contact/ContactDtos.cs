using BizCore.Domain.Enums;

namespace BizCore.Application.DTOs.Contact;

public class ContactDto
{
    public Guid Id { get; set; }
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
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    
    public decimal CustomerCreditLimit { get; set; }
    public int CustomerCreditDays { get; set; }
    public decimal CustomerOpeningBalance { get; set; }
    public decimal CustomerCurrentBalance { get; set; }
    
    public decimal SupplierCreditLimit { get; set; }
    public int SupplierCreditDays { get; set; }
    public decimal SupplierOpeningBalance { get; set; }
    public decimal SupplierCurrentBalance { get; set; }
    
    public DateTime CreatedAt { get; set; }
}

public class CreateContactDto
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
    public string? Notes { get; set; }
    
    public decimal CustomerCreditLimit { get; set; }
    public int CustomerCreditDays { get; set; } = 30;
    public decimal CustomerOpeningBalance { get; set; }
    
    public decimal SupplierCreditLimit { get; set; }
    public int SupplierCreditDays { get; set; } = 30;
    public decimal SupplierOpeningBalance { get; set; }
}

public class UpdateContactDto
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
    public string? Notes { get; set; }
    
    public decimal CustomerCreditLimit { get; set; }
    public int CustomerCreditDays { get; set; } = 30;
    public decimal CustomerOpeningBalance { get; set; }
    
    public decimal SupplierCreditLimit { get; set; }
    public int SupplierCreditDays { get; set; } = 30;
    public decimal SupplierOpeningBalance { get; set; }
}
