using BizCore.Application.DTOs.Auth;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponseDto>> RegisterAsync(RegisterDto dto);
    Task<ApiResponse<AuthResponseDto>> LoginAsync(LoginDto dto);
    Task<ApiResponse<AuthResponseDto>> TenantLoginAsync(TenantLoginDto dto);
    Task<ApiResponse<AuthResponseDto>> RefreshTokenAsync(string refreshToken);
    Task<ApiResponse> LogoutAsync(string refreshToken);

    // Secure provisioning
    Task<ApiResponse<object>> AcceptInviteAsync(AcceptInviteDto dto);
    Task<ApiResponse> RequestPasswordResetAsync(RequestPasswordResetDto dto);
    Task<ApiResponse> ResetPasswordAsync(ResetPasswordDto dto);
}
