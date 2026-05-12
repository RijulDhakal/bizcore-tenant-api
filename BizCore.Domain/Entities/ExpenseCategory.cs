using System.ComponentModel.DataAnnotations;

namespace BizCore.Domain.Entities;

public class ExpenseCategory : TenantEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Code { get; set; }

    public string? Description { get; set; }

    public Guid? ParentId { get; set; }
    public int Level { get; set; } = 0;

    [MaxLength(500)]
    public string? Path { get; set; }

    public ExpenseCategory? Parent { get; set; }
    public ICollection<ExpenseCategory> Children { get; set; } = new List<ExpenseCategory>();
}
