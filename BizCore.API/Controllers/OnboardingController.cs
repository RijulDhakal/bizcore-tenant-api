using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using BizCore.Application.Interfaces;
using BizCore.Shared.Wrappers;
using System.Text.Json;

namespace BizCore.API.Controllers;

[ApiController]
[Route("api/onboarding")]
[Authorize]
public class OnboardingController : ControllerBase
{
    private readonly ITenantDirectoryClient _tenantDirectory;

    public OnboardingController(ITenantDirectoryClient tenantDirectory)
    {
        _tenantDirectory = tenantDirectory;
    }

    private Guid TenantId => Guid.TryParse(User.FindFirst("tid")?.Value, out var tid) ? tid : Guid.Empty;

    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var tenant = await _tenantDirectory.GetTenantProfileAsync(TenantId);
        if (tenant == null)
            return NotFound(ApiResponse<string>.FailResult("Business not found"));

        return Ok(ApiResponse<string>.SuccessResult(tenant.OnboardingStatusJson ?? "{}"));
    }

    [HttpPost("step/{stepName}")]
    public async Task<IActionResult> MarkStepComplete(string stepName)
    {
        var tenant = await _tenantDirectory.GetTenantProfileAsync(TenantId);
        if (tenant == null)
            return NotFound(ApiResponse<string>.FailResult("Business not found"));

        var status = JsonSerializer.Deserialize<OnboardingStatusModel>(tenant.OnboardingStatusJson ?? "{}") ?? new OnboardingStatusModel();
        
        if (status.Steps.ContainsKey(stepName))
        {
            status.Steps[stepName] = true;
        }
        else
        {
            status.Steps.Add(stepName, true);
        }

        // Check if all essential steps completed
        var requiredSteps = new[] { "profile", "warehouse", "categories", "products", "pos" };
        var allCompleted = true;
        foreach (var req in requiredSteps)
        {
            if (!status.Steps.ContainsKey(req) || !status.Steps[req])
            {
                allCompleted = false;
                break;
            }
        }

        if (allCompleted)
        {
            status.IsCompleted = true;
            status.CompletedAt = DateTime.UtcNow;
        }

        var json = JsonSerializer.Serialize(status);
        var ok = await _tenantDirectory.UpdateTenantOnboardingStatusAsync(TenantId, json);
        if (!ok) return StatusCode(502, ApiResponse<string>.FailResult("Failed to update onboarding status via SuperAdmin API"));

        return Ok(ApiResponse<string>.SuccessResult(json));
    }

    [HttpPost("dismiss")]
    public async Task<IActionResult> Dismiss()
    {
        var tenant = await _tenantDirectory.GetTenantProfileAsync(TenantId);
        if (tenant == null)
            return NotFound(ApiResponse<string>.FailResult("Business not found"));

        var status = JsonSerializer.Deserialize<OnboardingStatusModel>(tenant.OnboardingStatusJson ?? "{}") ?? new OnboardingStatusModel();
        status.DismissedAt = DateTime.UtcNow;

        var json = JsonSerializer.Serialize(status);
        var ok = await _tenantDirectory.UpdateTenantOnboardingStatusAsync(TenantId, json);
        if (!ok) return StatusCode(502, ApiResponse<string>.FailResult("Failed to update onboarding status via SuperAdmin API"));

        return Ok(ApiResponse<string>.SuccessResult(json));
    }

    [HttpPost("reset")]
    public async Task<IActionResult> Reset()
    {
        var tenant = await _tenantDirectory.GetTenantProfileAsync(TenantId);
        if (tenant == null)
            return NotFound(ApiResponse<string>.FailResult("Business not found"));

        var status = new OnboardingStatusModel();
        var json = JsonSerializer.Serialize(status);
        var ok = await _tenantDirectory.UpdateTenantOnboardingStatusAsync(TenantId, json);
        if (!ok) return StatusCode(502, ApiResponse<string>.FailResult("Failed to update onboarding status via SuperAdmin API"));

        return Ok(ApiResponse<string>.SuccessResult(json));
    }
}

public class OnboardingStatusModel
{
    public bool IsCompleted { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? DismissedAt { get; set; }
    public Dictionary<string, bool> Steps { get; set; } = new();
}
