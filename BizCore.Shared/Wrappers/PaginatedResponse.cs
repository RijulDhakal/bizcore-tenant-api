namespace BizCore.Shared.Wrappers;

public class PaginatedResponse<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool HasNextPage => Page < TotalPages;
    public bool HasPreviousPage => Page > 1;

    public static PaginatedResponse<T> Create(List<T> items, int totalCount, int page, int pageSize)
        => new()
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
}

public class PagedApiResponse<T>
{
    public bool IsSuccess { get; set; }
    public string Message { get; set; } = string.Empty;
    public PaginatedResponse<T>? Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static PagedApiResponse<T> Success(List<T> items, int totalCount, int page, int pageSize, string message = "")
        => new()
        {
            IsSuccess = true,
            Message = message,
            Data = PaginatedResponse<T>.Create(items, totalCount, page, pageSize)
        };

    public static PagedApiResponse<T> Fail(string message, List<string>? errors = null)
        => new()
        {
            IsSuccess = false,
            Message = message,
            Errors = errors ?? new()
        };
}