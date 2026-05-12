using Microsoft.AspNetCore.Identity;
using BizCore.Domain.Enums;

namespace BizCore.Domain.Entities;

public class ApplicationUser : IdentityUser<Guid>
{
    public string FirstName { get; set; } = string.Empty;
    public string? MiddleName { get; set; }
    public string LastName { get; set; } = string.Empty;
    public Guid? CurrentTenantId { get; set; }
    public Guid? BusinessId { get; set; }
    public Business? Business { get; set; }
    public UserRole Role { get; set; } = UserRole.Owner;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    // public DateTime? DeletedAt { get; set; }
    public bool IsFirstLogin { get; set; } = false;
    public string? Title { get; set; }
    public string? Designation { get; set; }
    public string? AlternateEmail { get; set; }
    public string? AlternatePhone { get; set; }
    public string? CitizenshipNumber { get; set; }
    public string? PassportNumber { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? Gender { get; set; }
    public DateTime? LastLoginAt { get; set; }

    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<UserBusiness> UserBusinesses { get; set; } = new List<UserBusiness>();
}
