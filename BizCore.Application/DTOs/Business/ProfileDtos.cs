using System;

namespace BizCore.Application.DTOs.Business;

public class UpdateBusinessProfileDto
{
    public string? BusinessName { get; set; }
    public string? LegalName { get; set; }
    public string? BusinessType { get; set; }
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public string? AlternatePhone { get; set; }
    public string? Website { get; set; }
    public string? Description { get; set; }
    public string? Address { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? District { get; set; }
    public string? Province { get; set; }
    public string? PostalCode { get; set; }
    public string? Country { get; set; }
    public string? PANNumber { get; set; }
    public string? VATNumber { get; set; }
    public bool IsVATRegistered { get; set; }
}

public class UpdateOwnerProfileDto
{
    public string? Title { get; set; }
    public string? FirstName { get; set; }
    public string? MiddleName { get; set; }
    public string? LastName { get; set; }
    public string? Designation { get; set; }
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Phone { get; set; }
    public string? AlternateEmail { get; set; }
    public string? AlternatePhone { get; set; }
    public string? CitizenshipNumber { get; set; }
    public string? PassportNumber { get; set; }
}
