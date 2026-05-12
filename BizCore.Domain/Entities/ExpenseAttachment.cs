using BizCore.Domain.Entities;

namespace BizCore.Domain.Entities
{
    public class ExpenseAttachment : TenantEntity
    {
        public Guid ExpenseId { get; set; }
        public Expense? Expense { get; set; }
        
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string? Description { get; set; }
    }
}