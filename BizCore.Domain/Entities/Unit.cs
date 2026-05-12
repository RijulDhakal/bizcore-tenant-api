using System.ComponentModel.DataAnnotations;

namespace BizCore.Domain.Entities;

public class Unit : TenantEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Code { get; set; }

    [MaxLength(10)]
    public string? Symbol { get; set; }

    public bool IsBaseUnit { get; set; } = true;

    public decimal ConversionFactor { get; set; } = 1m;

    public Guid? BaseUnitId { get; set; }
    public Unit? BaseUnit { get; set; }
}
