namespace BizCore.Domain.Entities
{
public class BankTransaction : TenantEntity
{
    public Guid AccountId { get; set; }
    public BankAccount Account { get; set; }
    public string Type { get; set; }
    public decimal Amount { get; set; }
    public decimal BalanceAfter { get; set; }
    public DateTime TransactionDate { get; set; }
    public string? Description { get; set; }
    public string? Reference { get; set; }
    public string? Payee { get; set; }
    public string? Category { get; set; }
    public string? LinkedModule { get; set; }
    public Guid? LinkedId { get; set; }
    public Guid? LinkedTransactionId { get; set; }
}
}
