namespace BizCore.Shared.Wrappers;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string> Errors { get; set; } = new();

    public static ApiResponse<T> SuccessResult(T data, string message = "")
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> FailResult(string message, List<string>? errors = null)
        => new() { Success = false, Message = message, Errors = errors ?? new() };
}

public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string> Errors { get; set; } = new();

    public static ApiResponse SuccessResult(string message = "")
        => new() { Success = true, Message = message };

    public static ApiResponse FailResult(string message, List<string>? errors = null)
        => new() { Success = false, Message = message, Errors = errors ?? new() };
}
