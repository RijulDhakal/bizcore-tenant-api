using System.Security.Cryptography;
using System.Text;

namespace BizCore.Shared.Security;

public static class TokenHasher
{
    // Stable, URL-safe, case-insensitive storage using lowercase hex.
    public static string Sha256Hex(string input)
    {
        if (string.IsNullOrWhiteSpace(input))
            throw new ArgumentException("Token cannot be empty.", nameof(input));

        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA256.HashData(bytes);
        return Convert.ToHexString(hash).ToLowerInvariant();
    }

    public static string GenerateRawToken(int bytes = 32)
    {
        if (bytes < 16) bytes = 16;
        var data = RandomNumberGenerator.GetBytes(bytes);
        // Base64Url without padding for easy transport
        return Base64UrlEncode(data);
    }

    private static string Base64UrlEncode(byte[] data)
    {
        var s = Convert.ToBase64String(data);
        return s.Replace('+', '-').Replace('/', '_').TrimEnd('=');
    }
}
