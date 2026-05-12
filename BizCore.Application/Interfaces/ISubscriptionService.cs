using BizCore.Application.DTOs.Subscription;
using BizCore.Shared.Wrappers;

namespace BizCore.Application.Interfaces;

public interface ISubscriptionService
{
    Task<ApiResponse<List<SubscriptionPlanDto>>> GetPlansAsync();
    Task<ApiResponse<SubscriptionPlanDto>> GetPlanByIdAsync(Guid id);
    Task<ApiResponse<SubscriptionPlanDto>> CreatePlanAsync(CreateSubscriptionPlanDto dto);
    Task<ApiResponse<SubscriptionPlanDto>> UpdatePlanAsync(Guid id, CreateSubscriptionPlanDto dto);
    Task<ApiResponse> DeletePlanAsync(Guid id);
    Task<ApiResponse<List<SubscriptionPlanDto>>> GetActivePlansAsync();

    Task<ApiResponse<List<BusinessSubscriptionDto>>> GetBusinessSubscriptionsAsync(Guid businessId);
    Task<ApiResponse<BusinessSubscriptionDto>> GetCurrentSubscriptionAsync(Guid businessId);
    Task<ApiResponse<BusinessSubscriptionDto>> AssignPlanAsync(AssignPlanDto dto);
    Task<ApiResponse<BusinessSubscriptionDto>> RenewSubscriptionAsync(Guid businessId, string billingCycle);

    Task<ApiResponse<FeatureAccessDto>> GetFeatureAccessAsync(Guid businessId);
    Task<bool> HasFeatureAsync(Guid businessId, string feature);
    Task<bool> CanAddUserAsync(Guid businessId);
    Task<bool> CanAddProductAsync(Guid businessId);
    Task<bool> CanAddInvoiceAsync(Guid businessId);
}