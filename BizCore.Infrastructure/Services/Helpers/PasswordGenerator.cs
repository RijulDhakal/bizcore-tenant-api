using System;
using System.Linq;

namespace BizCore.Infrastructure.Services.Helpers;

public static class PasswordGenerator
{
    public static string GenerateSecurePassword(int length = 12)
    {
        const string upperCase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
        const string lowerCase = "abcdefghijkmnopqrstuvwxyz";
        const string digits = "23456789";
        const string special = "!@#$%^&*";
        
        var random = new Random();
        var password = new char[length];
        
        // Ensure at least one of each type for compliance
        password[0] = upperCase[random.Next(upperCase.Length)];
        password[1] = lowerCase[random.Next(lowerCase.Length)];
        password[2] = digits[random.Next(digits.Length)];
        password[3] = special[random.Next(special.Length)];
        
        // Fill the rest randomly
        var allChars = upperCase + lowerCase + digits + special;
        for (int i = 4; i < length; i++)
        {
            password[i] = allChars[random.Next(allChars.Length)];
        }
        
        // Shuffle the characters so the guaranteed ones aren't always at the start
        return new string(password.OrderBy(x => random.Next()).ToArray());
    }
}
