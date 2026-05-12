namespace BizCore.Shared.Helpers;

public static class PagingHelper
{
    public static (int skip, int take, int page, int pageSize) Normalize(
        int? page, int? pageSize, int defaultPageSize = 20, int maxPageSize = 100)
    {
        var p = page.HasValue && page.Value >= 1 ? page.Value : 1;
        var ps = pageSize.HasValue && pageSize.Value >= 1 ? pageSize.Value : defaultPageSize;
        ps = Math.Min(ps, maxPageSize);
        var skip = (p - 1) * ps;
        return (skip, ps, p, ps);
    }
}