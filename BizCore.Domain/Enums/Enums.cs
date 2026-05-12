namespace BizCore.Domain.Enums;

public enum UserRole
{
    SuperAdmin = 0,
    Admin = 1,
    Accountant = 2,
    Sales = 3,
    POSOperator = 4,
    Owner = 5,
    HRManager = 6,
}

public enum EntryType
{
    Credit,
    Debit
}

public enum PartyType
{
    Customer,
    Supplier
}

public enum ContactType
{
    Customer,
    Supplier,
    Both
}

public enum InvoiceStatus
{
    Draft,
    Sent,
    Confirmed,
    Paid,
    Overdue
}

public enum InvoiceType
{
    Retail = 0,
    Merchant = 1,
    Delivery = 2,
}

public enum StockMovementType
{
    StockIn,
    StockOut,
    Adjustment,
    Transfer,
    SaleOut,
    PurchaseIn
}

public enum BatchStatus
{
    Unassigned = 0,
    Active = 1,
    Expiring = 2,
    Expired = 3,
    Consumed = 4,
    WrittenOff = 5
}

public enum POSSessionStatus
{
    Open,
    Closed
}

public enum PaymentMethod
{
    Cash,
    Card,
    QR,
    Credit
}

public enum POSTransactionStatus
{
    Completed,
    Refunded,
    Held
}

// Phase 3: HR Enums
public enum EmploymentType
{
    FullTime,
    PartTime,
    Contract
}

public enum EmployeeStatus
{
    Active,
    OnLeave,
    Terminated
}

public enum AttendanceStatus
{
    Present,
    Absent,
    HalfDay,
    Holiday,
    Leave
}

public enum LeaveType
{
    Annual,
    Sick,
    Maternity,
    Paternity,
    Unpaid,
    Other
}

public enum LeaveStatus
{
    Pending,
    Approved,
    Rejected,
    Cancelled
}

public enum PayrollStatus
{
    Pending,
    Paid
}

public enum ProjectStatus
{
    Planning,
    Active,
    OnHold,
    Completed,
    Cancelled
}

public enum ProjectPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum ProjectTaskStatus
{
    Todo,
    InProgress,
    InReview,
    Done
}

public enum GoodsReceiptStatus
{
    Pending = 0,
    Partial = 1,
    Completed = 2,
    Cancelled = 3
}

public enum PurchaseReturnStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2,
    Processed = 3
}

public enum TransferType
{
    Internal = 0,
    Customer = 1,
    Return = 2
}

public enum TransferPriority
{
    Normal = 0,
    Urgent = 1
}

public enum TransferReason
{
    Restocking = 0,
    CustomerOrder = 1,
    Damage = 2,
    Consolidation = 3,
    QualityCheck = 4,
    Other = 5
}

public enum WarehouseType
{
    Godown = 0,
    Store = 1,
    Factory = 2,
    ColdStorage = 3
}

public enum WarehouseStatus
{
    Operational = 0,
    Maintenance = 1,
    Closed = 2
}

public enum PurchaseOrderStatus
{
    Draft = 0,
    PendingApproval = 1,
    Approved = 2,
    Rejected = 3,
    GRNPartial = 4,
    GRNComplete = 5,
    Closed = 6,
    Cancelled = 7
}

public enum OrderType
{
    Regular = 0,
    Emergency = 1,
    StockTransfer = 2,
    Import = 3
}

public enum Priority
{
    Normal = 0,
    Urgent = 1,
    Critical = 2
}

public enum PaymentType
{
    COD = 0,
    Credit = 1,
    Advance = 2,
    Installment = 3
}

public enum PaymentTerms
{
    COD = 0,
    NET15 = 1,
    NET30 = 2,
    NET45 = 3,
    NET60 = 4,
    Advance = 5
}

public enum ShippingMethod
{
    FOB = 0,
    CIF = 1,
    EXW = 2,
    DoorDelivery = 3,
    Pickup = 4
}

public enum ApprovalStatus
{
    Pending = 0,
    Approved = 1,
    Rejected = 2
}

public enum Currency
{
    NPR = 0,
    USD = 1,
    INR = 2,
    EUR = 3
}

public enum SupplierType
{
    Manufacturer = 0,
    Distributor = 1,
    Wholesaler = 2,
    Trader = 3
}

public enum VATCategory
{
    Unregistered = 0,
    Registered = 1,
    Excise = 2
}

public enum GoodsReceiptCondition
{
    Good = 0,
    Damaged = 1,
    PartialDamage = 2
}

public enum PaymentStatus
{
    Pending = 0,
    Paid = 1,
    Cancelled = 2
}

public enum PaymentRecordMethod
{
    BankTransfer = 0,
    Cheque = 1,
    Cash = 2,
    eSewa = 3,
    Khalti = 4
}

public enum ReturnType
{
    Defective = 0,
    WrongItem = 1,
    Excess = 2,
    PriceDispute = 3
}

public enum RefundType
{
    CreditNote = 0,
    CashRefund = 1,
    Replacement = 2
}

public enum ReturnCondition
{
    Unopened = 0,
    Sealed = 1,
    Damaged = 2
}

public enum Resolution
{
    CreditNote = 0,
    CashReplacement = 1,
    SameProduct = 2
}
