using System.Text.RegularExpressions;

namespace BizCore.Infrastructure.Services.Helpers;

public static class SlugHelper
{
    public static string Slugify(string? input)
    {
        if (string.IsNullOrWhiteSpace(input))
            return string.Empty;

        var value = input.Trim().ToLowerInvariant();
        value = Regex.Replace(value, @"[^a-z0-9\s-_]", string.Empty);
        value = Regex.Replace(value, @"[\s_]+", "-");
        value = Regex.Replace(value, @"-+", "-");
        return value.Trim('-');
    }
}
