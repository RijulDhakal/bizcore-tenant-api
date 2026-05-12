namespace BizCore.Domain.Entities;

public class UserBusiness : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid BusinessId { get; set; }

    public ApplicationUser User { get; set; } = null!;
    public Business Business { get; set; } = null!;
}
