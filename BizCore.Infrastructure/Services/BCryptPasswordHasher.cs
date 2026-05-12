using BizCore.Domain.Entities;
using Microsoft.AspNetCore.Identity;

namespace BizCore.Infrastructure.Services;

public class BCryptPasswordHasher : IPasswordHasher<ApplicationUser>
{
    private readonly PasswordHasher<ApplicationUser> _identityHasher = new();

    public string HashPassword(ApplicationUser user, string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    public PasswordVerificationResult VerifyHashedPassword(ApplicationUser user, string hashedPassword, string providedPassword)
    {
        if (string.IsNullOrEmpty(hashedPassword)) return PasswordVerificationResult.Failed;

        // BCrypt hashes typically start with $2a$, $2b$, or $2y$
        if (hashedPassword.StartsWith("$2a$") || hashedPassword.StartsWith("$2b$") || hashedPassword.StartsWith("$2y$"))
        {
            try
            {
                return BCrypt.Net.BCrypt.Verify(providedPassword, hashedPassword) 
                    ? PasswordVerificationResult.Success 
                    : PasswordVerificationResult.Failed;
            }
            catch (BCrypt.Net.SaltParseException)
            {
                return PasswordVerificationResult.Failed;
            }
        }

        // Fallback to default ASP.NET Identity (PBKDF2) verification for existing users
        return _identityHasher.VerifyHashedPassword(user, hashedPassword, providedPassword);
    }
}
