namespace BizCore.Domain.Entities
{
    public class BankAccount : TenantEntity
    {
        public string AccountName { get; set; }
        // e.g. "Main Cash", "NIC Asia Account"
        public string AccountType { get; set; }
        // Cash / Bank / Mobile Banking
        public string? BankName { get; set; }
        public string? AccountNumber { get; set; }
        public string? BranchName { get; set; }
        public decimal OpeningBalance { get; set; }
        public decimal CurrentBalance { get; set; }
        public bool IsDefault { get; set; } = false;
        public bool IsActive { get; set; } = true;
        public string Currency { get; set; } = "NPR";
    }
}
