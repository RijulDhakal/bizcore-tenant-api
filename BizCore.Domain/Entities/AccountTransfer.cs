using System.ComponentModel.DataAnnotations;

namespace BizCore.Domain.Entities;

public class AccountTransfer : TenantEntity
{
    [Required]
    public Guid FromAccountId { get; set; }

    [Required]
    public Guid ToAccountId { get; set; }

    [Required]
    public decimal Amount { get; set; }

    public DateTime TransferDate { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? Reference { get; set; }

    public string? Description { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "Pending";

    public BankAccount? FromAccount { get; set; }
    public BankAccount? ToAccount { get; set; }
}
