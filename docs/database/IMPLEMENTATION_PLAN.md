# BizCore Database Redesign - Implementation Plan

**Version:** 1.0  
**Date:** 2026-04-16  
**Status:** Draft  
**Based on:** SPEC.md v1.0  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Implementation Phases](#2-implementation-phases)
3. [Phase 1: Batch & Inventory Foundation](#3-phase-1-batch--inventory-foundation)
4. [Phase 2: HR Enhancement](#4-phase-2-hr-enhancement)
5. [Phase 3: Vendor Separation](#5-phase-3-vendor-separation)
6. [Phase 4: Platform Billing](#6-phase-4-platform-billing)
7. [Cross-Cutting Concerns](#7-cross-cutting-concerns)
8. [Risk Assessment](#8-risk-assessment)
9. [Testing Strategy](#9-testing-strategy)
10. [Rollback Plan](#10-rollback-plan)

---

## 1. Executive Summary

### 1.1 Overview

This implementation plan outlines the phased approach to migrate BizCore's database from its current single-schema-with-TenantId design to the corrected hybrid multi-tenant architecture specified in SPEC.md.

### 1.2 Scope

| Include | Exclude |
|---------|---------|
| Entity Framework Core migrations | Frontend UI changes (separate sprint) |
| Domain entity updates | API contract changes (separate sprint) |
| Service layer updates | Enterprise schema-per-tenant (Phase 5) |
| Data migration scripts | Performance optimization (post-launch) |
| Unit/integration tests | Load testing |

### 1.3 Timeline Overview

```
Week 1-2    Week 3-4    Week 5     Week 6-7    Week 8+
─────────────────────────────────────────────────────────►
Phase 1     Phase 2     Phase 3    Phase 4     Stabilization
Batch &     HR          Vendor     Platform    & Polish
Inventory   Enhancement Separation  Billing
```

### 1.4 Effort Estimate

| Phase | Tasks | Complexity | Effort |
|-------|-------|------------|--------|
| Phase 1 | 24 | High | 2 weeks |
| Phase 2 | 18 | Medium | 1.5 weeks |
| Phase 3 | 8 | Low | 0.5 weeks |
| Phase 4 | 12 | Medium | 1.5 weeks |
| Stabilization | 6 | Low | 0.5 weeks |
| **Total** | **68** | - | **6 weeks** |

---

## 2. Implementation Phases

### Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              IMPLEMENTATION ROADMAP                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  PHASE 1: Batch & Inventory Foundation (Week 1-2)                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  • Create batches table                                                 │    │
│  │  • Create inventory table                                                │    │
│  │  • Create inventory_movements table                                     │    │
│  │  • Update Product entity with feature flags                             │    │
│  │  • Add batch_id to POS items & invoice items                           │    │
│  │  • Create FEFO allocation service                                      │    │
│  │  • Migrate CurrentStock to inventory                                    │    │
│  │  • Update inventory service                                             │    │
│  │  • Update POS service to use batch tracking                             │    │
│  │  • Update purchase order service                                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  PHASE 2: HR Enhancement (Week 3-4)                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  • Create salary_components table                                       │    │
│  │  • Create employee_salary_components table                              │    │
│  │  • Create leave_policies table                                          │    │
│  │  • Create employee_leave_balances table                                 │    │
│  │  • Update Employee entity                                               │    │
│  │  • Update Payroll service for dynamic components                        │    │
│  │  • Update LeaveRequest service                                          │    │
│  │  • Migrate existing salary data                                         │    │
│  │  • Seed default salary components                                       │    │
│  │  • Seed default leave policies                                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  PHASE 3: Vendor Separation (Week 5)                                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  • Create vendors table                                               │    │
│  │  • Add vendor_id to purchase_orders                                    │    │
│  │  • Migrate suppliers from contacts                                     │    │
│  │  • Update PurchaseOrder service                                        │    │
│  │  • Create VendorService                                                │    │
│  │  • Update contact types (keep contacts as customers only)              │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  PHASE 4: Platform Billing (Week 6-7)                                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  • Create client_documents table                                      │    │
│  │  • Create platform_invoices table                                      │    │
│  │  • Create platform_payments table                                       │    │
│  │  • Create ClientDocument entity                                        │    │
│  │  • Create PlatformInvoice entity                                       │    │
│  │  • Create PlatformPayment entity                                       │    │
│  │  • Create BillingService                                               │    │
│  │  • Create DocumentService                                               │    │
│  │  • Add SuperAdmin billing endpoints                                    │    │
│  │  • Create subscription renewal background job                          │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  STABILIZATION: Testing & Polish (Week 8)                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │  • Integration testing                                                 │    │
│  │  • Data validation                                                      │    │
│  │  • Performance testing                                                  │    │
│  │  • Documentation update                                                 │    │
│  │  • Deployment preparation                                               │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Phase 1: Batch & Inventory Foundation

**Duration:** 2 weeks  
**Priority:** Critical  
**Dependencies:** None (can start immediately)

### 3.1 Task Breakdown

#### 3.1.1 Database Migration Tasks

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 1.1 | Create batches table migration | Migration | 2h | `*_AddBatches.cs` |
| 1.2 | Create inventory table migration | Migration | 2h | `*_AddInventory.cs` |
| 1.3 | Create inventory_movements table migration | Migration | 2h | `*_AddInventoryMovements.cs` |
| 1.4 | Add product feature flags (migration) | Migration | 1h | `*_AddProductFeatureFlags.cs` |
| 1.5 | Add batch_id to POS items (migration) | Migration | 1h | `*_AddBatchIdToPOSItems.cs` |
| 1.6 | Add batch_id to invoice_items (migration) | Migration | 1h | `*_AddBatchIdToInvoiceItems.cs` |
| 1.7 | Migrate CurrentStock to inventory | Data Migration | 4h | `*_MigrateStockToInventory.sql` |
| 1.8 | Create initial inventory movements | Data Migration | 2h | `*_SeedInitialMovements.sql` |

#### 3.1.2 Domain Entity Tasks

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 1.9 | Create Batch entity | Entity | 1h | `Batch.cs` |
| 1.10 | Create Inventory entity | Entity | 2h | `Inventory.cs` |
| 1.11 | Create InventoryMovement entity | Entity | 2h | `InventoryMovement.cs` |
| 1.12 | Update Product entity (add feature flags) | Entity | 1h | `Product.cs` |
| 1.13 | Update POSTransactionItem (add batch_id) | Entity | 1h | `POSTransactionItem.cs` |
| 1.14 | Update InvoiceItem (add batch_id, warehouse_id) | Entity | 1h | `InvoiceItem.cs` |
| 1.15 | Create BatchRepository | Repository | 2h | `BatchRepository.cs` |
| 1.16 | Create InventoryRepository | Repository | 3h | `InventoryRepository.cs` |
| 1.17 | Update AppDbContext (new entities) | Config | 3h | `AppDbContext.cs` |

#### 3.1.3 Service Layer Tasks

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 1.18 | Create IInventoryService interface | Interface | 1h | `IInventoryService.cs` |
| 1.19 | Implement InventoryService | Service | 8h | `InventoryService.cs` |
| 1.20 | Create FEFO allocation service | Service | 6h | `FEFOService.cs` |
| 1.21 | Update POSService (batch tracking) | Service | 6h | `POSService.cs` |
| 1.22 | Update PurchaseOrderService (batch receipt) | Service | 4h | `PurchaseOrderService.cs` |
| 1.23 | Update InvoiceService (batch tracking) | Service | 4h | `InvoiceService.cs` |

#### 3.1.4 Controller/API Tasks

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 1.24 | Create BatchesController | API | 3h | `BatchesController.cs` |
| 1.25 | Create InventoryController | API | 4h | `InventoryController.cs` |
| 1.26 | Update POSController (batch selection) | API | 4h | `POSController.cs` |
| 1.27 | Update InventoryController (stock endpoints) | API | 3h | `InventoryController.cs` |

### 3.2 Detailed Task Specifications

#### Task 1.9: Create Batch Entity

**File:** `BizCore.Domain/Entities/Batch.cs`

```csharp
using System;
using BizCore.Domain.Entities;

namespace BizCore.Domain.Entities;

public class Batch : BaseEntity
{
    public Guid ProductId { get; set; }
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ManufacturingDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public DateTime? ManufacturingDateSupplier { get; set; }
    public string? SupplierBatchNumber { get; set; }
    public decimal? CostPrice { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    
    // Navigation
    public Product Product { get; set; } = null!;
}
```

**Acceptance Criteria:**
- [ ] Batch entity created with all specified properties
- [ ] Unique constraint on (ProductId, BatchNumber)
- [ ] Index on ExpiryDate for FEFO queries
- [ ] Unit tests for BatchService

#### Task 1.11: Create InventoryMovement Entity

**File:** `BizCore.Domain/Entities/InventoryMovement.cs`

```csharp
public class InventoryMovement : TenantEntity
{
    public Guid InventoryId { get; set; }
    public Guid ProductId { get; set; }
    public Guid WarehouseId { get; set; }
    public Guid? BatchId { get; set; }
    public StockMovementType MovementType { get; set; }
    public int Quantity { get; set; }
    public int BalanceAfter { get; set; }
    public string? ReferenceType { get; set; }
    public Guid? ReferenceId { get; set; }
    public string? ReferenceNumber { get; set; }
    public string? Notes { get; set; }
    public string? Reason { get; set; }
    public DateTime MovedAt { get; set; }
    public Guid? CreatedBy { get; set; }
    
    // Navigation
    public Inventory? Inventory { get; set; }
    public Product? Product { get; set; }
    public Warehouse? Warehouse { get; set; }
    public Batch? Batch { get; set; }
}
```

**Acceptance Criteria:**
- [ ] MovementType enum expanded with new types
- [ ] All stock changes create movement records
- [ ] Movements are immutable (no updates/deletes)
- [ ] Index on reference_type + reference_id

#### Task 1.19: Implement InventoryService

**File:** `BizCore.Infrastructure/Services/InventoryService.cs`

```csharp
public interface IInventoryService
{
    Task<InventoryStockDto> GetStockAsync(Guid productId, Guid warehouseId, Guid? batchId = null);
    Task<IEnumerable<InventoryStockDto>> GetStockByProductAsync(Guid productId);
    Task<IEnumerable<InventoryStockDto>> GetStockByWarehouseAsync(Guid warehouseId);
    Task<IEnumerable<LowStockAlertDto>> GetLowStockItemsAsync();
    Task<IEnumerable<ExpiringStockDto>> GetExpiringStockAsync(int daysAhead = 30);
    Task<InventoryMovementDto> RecordMovementAsync(RecordMovementRequest request);
    Task TransferStockAsync(TransferStockRequest request);
    Task AdjustStockAsync(AdjustStockRequest request);
    Task<IEnumerable<InventoryAllocationDto>> AllocateForSaleAsync(AllocateForSaleRequest request);
}
```

**Acceptance Criteria:**
- [ ] All inventory operations create movement records
- [ ] Stock cannot go negative
- [ ] Available quantity = quantity - reserved_quantity
- [ ] FEFO allocation for sales

### 3.3 Phase 1 Dependencies

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1 DEPENDENCY GRAPH                            │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   Task 1.9 ─────┐                                                            │
│   (Batch entity) │                                                            │
│         │        │                                                            │
│         ▼        ▼                                                            │
│   Task 1.10 ────► Task 1.17 ────► Task 1.18                                 │
│   (Inventory)    (AppDbContext)  (IInventoryService)                         │
│         │              │                │                                     │
│         ▼              │                ▼                                     │
│   Task 1.11 ───────────┴───────► Task 1.19 ◄─── Task 1.20                  │
│   (Movement)              (InventoryService)   (FEFO)                         │
│         │                           │                                        │
│         ▼                           ▼                                        │
│   Task 1.18 ────────────────────► Task 1.21 ────► Task 1.22 ────► Task 1.23  │
│   (Interface)                      (POSService)  (POService)  (InvoiceSvc)  │
│                                        │             │              │        │
│                                        ▼             ▼              ▼        │
│                                    Task 1.26    Task 1.25      Task 1.27    │
│                                    (POS Ctrl)   (Inv Ctrl)    (Inv Ctrl)     │
│                                                                               │
│   All migration tasks (1.1-1.8) must complete before running service tests    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 3.4 Phase 1 Test Scenarios

| # | Scenario | Type | Expected Result |
|---|----------|------|-----------------|
| T1.1 | Create batch for product | Unit | Batch created with unique number |
| T1.2 | Record stock in (purchase) | Unit | Inventory quantity increases, movement created |
| T1.3 | Record stock out (sale) | Unit | Inventory quantity decreases, movement created |
| T1.4 | Stock cannot go negative | Unit | Exception thrown |
| T1.5 | FEFO allocation - single batch | Unit | Earliest expiry selected |
| T1.6 | FEFO allocation - multiple batches | Unit | Ordered by expiry, sufficient stock |
| T1.7 | FEFO allocation - insufficient stock | Unit | Exception with shortage amount |
| T1.8 | Get expiring stock (30 days) | Unit | Only batches expiring within 30 days |
| T1.9 | Transfer between warehouses | Integration | Source decreases, dest increases |
| T1.10 | Low stock alert | Unit | Products at/below reorder point |

---

## 4. Phase 2: HR Enhancement

**Duration:** 1.5 weeks  
**Priority:** High  
**Dependencies:** Phase 1 complete

### 4.1 Task Breakdown

#### 4.1.1 Database Migration Tasks

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 2.1 | Create salary_components table | Migration | 1h | `*_AddSalaryComponents.cs` |
| 2.2 | Create employee_salary_components table | Migration | 1h | `*_AddEmployeeSalaryComponents.cs` |
| 2.3 | Create leave_policies table | Migration | 1h | `*_AddLeavePolicies.cs` |
| 2.4 | Create employee_leave_balances table | Migration | 1h | `*_AddEmployeeLeaveBalances.cs` |
| 2.5 | Update Employee entity (add salary_component_id) | Migration | 1h | `*_UpdateEmployeeForSalary.cs` |
| 2.6 | Seed default salary components | Data Seed | 2h | `DataSeeder.cs` |
| 2.7 | Seed default leave policies | Data Seed | 2h | `DataSeeder.cs` |
| 2.8 | Initialize leave balances for existing employees | Data Migration | 2h | `*_InitializeLeaveBalances.sql` |

#### 4.1.2 Domain Entity Tasks

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 2.9 | Create SalaryComponent entity | Entity | 1h | `SalaryComponent.cs` |
| 2.10 | Create EmployeeSalaryComponent entity | Entity | 1h | `EmployeeSalaryComponent.cs` |
| 2.11 | Create LeavePolicy entity | Entity | 1h | `LeavePolicy.cs` |
| 2.12 | Create EmployeeLeaveBalance entity | Entity | 1h | `EmployeeLeaveBalance.cs` |
| 2.13 | Update Employee entity | Entity | 1h | `Employee.cs` |
| 2.14 | Update Payroll entity | Entity | 1h | `Payroll.cs` |
| 2.15 | Update AppDbContext | Config | 2h | `AppDbContext.cs` |

#### 4.1.3 Service Layer Tasks

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 2.16 | Create ISalaryComponentService | Interface | 1h | `ISalaryComponentService.cs` |
| 2.17 | Create ILeavePolicyService | Interface | 1h | `ILeavePolicyService.cs` |
| 2.18 | Create ILeaveBalanceService | Interface | 1h | `ILeaveBalanceService.cs` |
| 2.19 | Implement SalaryComponentService | Service | 4h | `SalaryComponentService.cs` |
| 2.20 | Implement LeavePolicyService | Service | 4h | `LeavePolicyService.cs` |
| 2.21 | Implement LeaveBalanceService | Service | 4h | `LeaveBalanceService.cs` |
| 2.22 | Update PayrollService (dynamic components) | Service | 8h | `PayrollService.cs` |
| 2.23 | Update LeaveRequestService | Service | 4h | `LeaveRequestService.cs` |

#### 4.1.4 Controller/API Tasks

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 2.24 | Create SalaryComponentsController | API | 3h | `SalaryComponentsController.cs` |
| 2.25 | Create LeavePoliciesController | API | 3h | `LeavePoliciesController.cs` |
| 2.26 | Create LeaveBalancesController | API | 3h | `LeaveBalancesController.cs` |
| 2.27 | Update HRController (payroll changes) | API | 4h | `HRController.cs` |

### 4.2 Detailed Task Specifications

#### Task 2.22: Update PayrollService

**File:** `BizCore.Infrastructure/Services/PayrollService.cs`

**Current Implementation (Problematic):**
```csharp
// Hardcoded salary calculations
var houseRent = employee.BasicSalary * 0.4m;
var transport = 2000m;
var medical = 1500m;
var pfDeduction = employee.BasicSalary * 0.12m;
```

**Corrected Implementation:**
```csharp
public class PayrollCalculationService
{
    private readonly IEnumerable<SalaryComponent> _components;
    
    public PayrollCalculationResult Calculate(Employee employee, int month, int year)
    {
        var result = new PayrollCalculationResult
        {
            BasicSalary = employee.BasicSalary
        };
        
        // Get employee-specific components
        var employeeComponents = _employeeSalaryComponentRepo
            .GetActiveComponents(employee.Id)
            .ToList();
        
        // Get company default components
        var defaultComponents = _salaryComponentRepo
            .GetActiveDefaults()
            .Where(c => employeeComponents.All(ec => ec.ComponentId != c.Id))
            .ToList();
        
        var allComponents = employeeComponents
            .Select(ec => new { ec.Component, CustomValue = ec.CustomValue })
            .Concat(defaultComponents.Select(c => new { Component = c, CustomValue = (decimal?)null }))
            .ToList();
        
        foreach (var item in allComponents)
        {
            var amount = CalculateComponentAmount(item.Component, employee, result);
            if (item.CustomValue.HasValue)
                amount = item.CustomValue.Value;
                
            if (item.Component.ComponentType == "Allowance")
                result.Allowances += amount;
            else
                result.Deductions += amount;
                
            result.Items.Add(new PayrollItemDto
            {
                ComponentCode = item.Component.Code,
                ComponentName = item.Component.Name,
                Type = item.Component.ComponentType,
                Amount = amount,
                IsTaxable = item.Component.IsTaxable
            });
        }
        
        result.GrossSalary = result.BasicSalary + result.Allowances;
        result.NetSalary = result.GrossSalary - result.Deductions;
        
        return result;
    }
    
    private decimal CalculateComponentAmount(
        SalaryComponent component, 
        Employee employee, 
        PayrollCalculationResult current)
    {
        return component.CalculationType switch
        {
            "Percentage" => component.PercentageOf switch
            {
                "BasicSalary" => employee.BasicSalary * component.Value / 100,
                "GrossSalary" => current.GrossSalary * component.Value / 100,
                _ => 0
            },
            "Fixed" => component.Value,
            _ => 0
        };
    }
}
```

**Acceptance Criteria:**
- [ ] Payroll calculation reads from salary_components
- [ ] Employee-specific overrides are applied
- [ ] Percentage calculations use correct base
- [ ] Taxable/non-taxable correctly classified
- [ ] PF/ESI calculations are configurable

### 4.3 Phase 2 Test Scenarios

| # | Scenario | Type | Expected Result |
|---|----------|------|-----------------|
| T2.1 | Get default salary components | Unit | All seeded components returned |
| T2.2 | Calculate HRA (40% of basic) | Unit | Correct percentage |
| T2.3 | Employee override of TA | Unit | Custom value used |
| T2.4 | Payroll with all components | Integration | Correct net salary |
| T2.5 | Get default leave policies | Unit | All seeded policies returned |
| T2.6 | Get employee leave balance | Unit | Correct available days |
| T2.7 | Apply leave (within balance) | Unit | Balance decreased |
| T2.8 | Apply leave (exceeds balance) | Unit | Validation error |
| T2.9 | Leave carry forward (within limit) | Unit | CF applied to new year |
| T2.10 | Leave carry forward (exceeds limit) | Unit | Capped at max |

---

## 5. Phase 3: Vendor Separation

**Duration:** 0.5 weeks  
**Priority:** Medium  
**Dependencies:** Phase 2 complete

### 5.1 Task Breakdown

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 3.1 | Create vendors table | Migration | 1h | `*_AddVendors.cs` |
| 3.2 | Add vendor_id to purchase_orders | Migration | 1h | `*_AddVendorIdToPurchaseOrders.cs` |
| 3.3 | Create Vendor entity | Entity | 1h | `Vendor.cs` |
| 3.4 | Create IVendorService | Interface | 1h | `IVendorService.cs` |
| 3.5 | Implement VendorService | Service | 3h | `VendorService.cs` |
| 3.6 | Migrate suppliers from contacts | Data Migration | 4h | `*_MigrateSuppliersToVendors.sql` |
| 3.7 | Update PurchaseOrderService | Service | 3h | `PurchaseOrderService.cs` |
| 3.8 | Create VendorsController | API | 2h | `VendorsController.cs` |

### 5.2 Detailed Task Specifications

#### Task 3.6: Migrate Suppliers to Vendors

**SQL Migration Script:**

```sql
-- Step 1: Create vendors from suppliers
INSERT INTO vendors (
    id, 
    name, 
    business_name, 
    email, 
    phone, 
    alt_phone,
    address, 
    city,
    pan_number, 
    opening_balance,
    payment_terms,
    credit_limit,
    is_active,
    created_at, 
    updated_at,
    is_deleted
)
SELECT 
    gen_random_uuid(),
    COALESCE(business_name, name),
    business_name,
    email,
    phone,
    NULL,
    address,
    city,
    pan_number,
    opening_balance,
    'Net30',  -- default payment terms
    0,         -- default credit limit
    true,
    NOW(),
    NOW(),
    false
FROM contacts 
WHERE type = 'Supplier' AND is_deleted = false;

-- Step 2: Update purchase_orders with vendor_id
UPDATE purchase_orders po
SET vendor_id = v.id
FROM vendors v
WHERE po.supplier_id IS NOT NULL
  AND v.name = (
      SELECT COALESCE(business_name, name) 
      FROM contacts c 
      WHERE c.id = po.supplier_id
  );

-- Step 3: Create mapping for reference integrity
CREATE TABLE IF NOT EXISTS contact_vendor_mapping (
    contact_id UUID PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO contact_vendor_mapping (contact_id, vendor_id)
SELECT c.id, v.id
FROM contacts c
JOIN vendors v ON v.name = COALESCE(c.business_name, c.name)
WHERE c.type = 'Supplier';

-- Step 4: Verify migration
SELECT 
    (SELECT COUNT(*) FROM vendors) AS vendor_count,
    (SELECT COUNT(*) FROM purchase_orders WHERE vendor_id IS NOT NULL) AS po_mapped,
    (SELECT COUNT(*) FROM purchase_orders WHERE vendor_id IS NULL AND supplier_id IS NOT NULL) AS po_unmapped;
```

**Acceptance Criteria:**
- [ ] All suppliers migrated to vendors
- [ ] All purchase orders linked to vendors
- [ ] No orphaned purchase orders
- [ ] Migration is idempotent (re-run safe)

---

## 6. Phase 4: Platform Billing

**Duration:** 1.5 weeks  
**Priority:** High  
**Dependencies:** Phase 3 complete

### 6.1 Task Breakdown

| # | Task | Type | Effort | Files |
|---|------|------|--------|-------|
| 4.1 | Create client_documents table | Migration | 1h | `*_AddClientDocuments.cs` |
| 4.2 | Create platform_invoices table | Migration | 1h | `*_AddPlatformInvoices.cs` |
| 4.3 | Create platform_payments table | Migration | 1h | `*_AddPlatformPayments.cs` |
| 4.4 | Create ClientDocument entity | Entity | 1h | `ClientDocument.cs` |
| 4.5 | Create PlatformInvoice entity | Entity | 2h | `PlatformInvoice.cs` |
| 4.6 | Create PlatformPayment entity | Entity | 2h | `PlatformPayment.cs` |
| 4.7 | Update AppDbContext (Master schema) | Config | 2h | `AppDbContext.cs` |
| 4.8 | Create IDocumentService | Interface | 1h | `IDocumentService.cs` |
| 4.9 | Create IBillingService | Interface | 1h | `IBillingService.cs` |
| 4.10 | Implement DocumentService | Service | 4h | `DocumentService.cs` |
| 4.11 | Implement BillingService | Service | 8h | `BillingService.cs` |
| 4.12 | Create BillingController (SuperAdmin) | API | 4h | `BillingController.cs` |
| 4.13 | Create ClientDocumentsController (SuperAdmin) | API | 3h | `ClientDocumentsController.cs` |
| 4.14 | Create subscription renewal background job | Job | 6h | `SubscriptionRenewalJob.cs` |
| 4.15 | Create overdue invoice check job | Job | 4h | `OverdueInvoiceJob.cs` |

### 6.2 Detailed Task Specifications

#### Task 4.11: Implement BillingService

**File:** `BizCore.Infrastructure/Services/BillingService.cs`

```csharp
public interface IBillingService
{
    // Invoice operations
    Task<PlatformInvoiceDto> CreateInvoiceAsync(CreateInvoiceRequest request);
    Task<PlatformInvoiceDto> GetInvoiceAsync(Guid invoiceId);
    Task<IEnumerable<PlatformInvoiceDto>> GetClientInvoicesAsync(Guid clientId);
    Task<PlatformInvoiceDto> SendInvoiceAsync(Guid invoiceId);
    Task<PlatformInvoiceDto> MarkAsPaidAsync(MarkPaidRequest request);
    Task<PlatformInvoiceDto> CancelInvoiceAsync(Guid invoiceId);
    
    // Payment operations
    Task<PlatformPaymentDto> RecordPaymentAsync(RecordPaymentRequest request);
    Task<IEnumerable<PlatformPaymentDto>> GetInvoicePaymentsAsync(Guid invoiceId);
    Task<IEnumerable<PlatformPaymentDto>> GetClientPaymentsAsync(Guid clientId);
    
    // Subscription billing
    Task GenerateSubscriptionInvoicesAsync();
    Task ProcessRenewalsAsync();
    
    // Aging
    Task<IEnumerable<OverdueInvoiceDto>> GetOverdueInvoicesAsync(int graceDays = 7);
}

public class BillingService : IBillingService
{
    private readonly AppDbContext _context;
    private readonly ISubscriptionService _subscriptionService;
    
    public async Task GenerateSubscriptionInvoicesAsync()
    {
        var today = DateTime.UtcNow.Date;
        
        // Get subscriptions due for billing
        var subscriptions = await _context.ClientSubscriptions
            .Where(s => s.Status == "Active")
            .Where(s => s.CurrentPeriodEnd <= today)
            .Include(s => s.Client)
            .Include(s => s.Plan)
            .ToListAsync();
        
        foreach (var subscription in subscriptions)
        {
            // Check if invoice already exists for this period
            var existingInvoice = await _context.PlatformInvoices
                .AnyAsync(i => i.SubscriptionId == subscription.Id
                    && i.PeriodStart == subscription.CurrentPeriodStart
                    && i.PeriodEnd == subscription.CurrentPeriodEnd);
            
            if (existingInvoice) continue;
            
            var invoice = new PlatformInvoice
            {
                InvoiceNumber = await GenerateInvoiceNumberAsync(),
                ClientId = subscription.ClientId,
                SubscriptionId = subscription.Id,
                InvoiceType = "Subscription",
                PeriodStart = subscription.CurrentPeriodStart,
                PeriodEnd = subscription.CurrentPeriodEnd,
                Subtotal = subscription.Plan.MonthlyPrice,
                TaxAmount = 0, // Nepal VAT on services?
                TotalAmount = subscription.Plan.MonthlyPrice,
                Currency = subscription.Client.Currency,
                Status = "Draft",
                IssueDate = today,
                DueDate = today.AddDays(15),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            
            _context.PlatformInvoices.Add(invoice);
        }
        
        await _context.SaveChangesAsync();
    }
    
    public async Task ProcessRenewalsAsync()
    {
        var today = DateTime.UtcNow.Date;
        
        // Get expired subscriptions with auto-renew
        var expired = await _context.ClientSubscriptions
            .Where(s => s.Status == "Active")
            .Where(s => s.CurrentPeriodEnd < today)
            .Where(s => s.AutoRenew == true)
            .Include(s => s.Plan)
            .ToListAsync();
        
        foreach (var subscription in expired)
        {
            // Check if paid
            var invoice = await _context.PlatformInvoices
                .Where(i => i.SubscriptionId == subscription.Id)
                .Where(i => i.Status == "Paid")
                .OrderByDescending(i => i.IssueDate)
                .FirstOrDefaultAsync();
            
            if (invoice != null)
            {
                // Renew subscription
                subscription.CurrentPeriodStart = subscription.CurrentPeriodEnd;
                subscription.CurrentPeriodEnd = subscription.CurrentPeriodEnd.AddMonths(
                    subscription.BillingCycle == "Monthly" ? 1 : 12);
                subscription.Status = "Active";
            }
            else
            {
                // Mark as expired
                subscription.Status = "Expired";
                
                // Notify client (future: email integration)
                await _notificationService.NotifySubscriptionExpired(subscription);
            }
        }
        
        await _context.SaveChangesAsync();
    }
}
```

**Acceptance Criteria:**
- [ ] Subscription invoices auto-generated
- [ ] Payments correctly linked to invoices
- [ ] Partial payments supported
- [ ] Auto-renewal processing works
- [ ] Overdue invoices identified correctly

---

## 7. Cross-Cutting Concerns

### 7.1 Error Handling

| Phase | Exception Type | Handling |
|-------|--------------|----------|
| All | `ConcurrencyException` | Retry with exponential backoff (3 attempts) |
| All | `DbUpdateException` | Log and surface user-friendly message |
| Inventory | `InsufficientStockException` | Return available quantity |
| Payroll | `InvalidCalculationException` | Show component causing error |
| Billing | `PaymentFailedException` | Record failure reason, allow retry |

### 7.2 Logging Requirements

| Event | Level | Fields |
|-------|-------|--------|
| Stock movement recorded | Info | ProductId, WarehouseId, Quantity, Type, Reference |
| Payroll calculated | Info | EmployeeId, NetSalary, ComponentCount |
| Invoice generated | Info | InvoiceNumber, ClientId, Amount |
| Payment received | Info | InvoiceId, Amount, Method |
| Migration started | Warning | MigrationName, EstimatedDuration |
| Stock goes negative (blocked) | Error | ProductId, RequestedQty, AvailableQty |

### 7.3 Transaction Boundaries

| Operation | Boundary | Rationale |
|-----------|----------|-----------|
| Stock movement | Single operation | Must be atomic |
| Transfer | Two movements + transfer record | Atomic with transfer as anchor |
| Payroll calculation | Single payroll record + items | Re-calculation allowed |
| Invoice + Payment | Single transaction | Cannot have invoice without payment record |
| Bulk invoice generation | Per-subscription | Individual failures don't affect others |

### 7.4 Performance Requirements

| Operation | Target | Max |
|-----------|--------|-----|
| Get stock (single item) | 50ms | 200ms |
| Get stock by warehouse (100 items) | 200ms | 500ms |
| Record movement | 100ms | 300ms |
| FEFO allocation (10 batches) | 100ms | 200ms |
| Calculate payroll | 500ms | 1s |
| Generate subscription invoices (100) | 5s | 10s |

---

## 8. Risk Assessment

### 8.1 Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data migration corrupts existing stock | Medium | Critical | Pre-migration backup, dry-run validation |
| FEFO allocation slows down POS | Medium | High | Caching, async allocation |
| Payroll calculation errors (back pay) | Low | Critical | Parallel calculation comparison |
| Batch cleanup breaks existing orders | Low | High | Soft delete only, retain history |
| Subscription renewal fails | Medium | Medium | Retry queue, manual override |
| Performance degradation at scale | High | Medium | Index optimization, query tuning |

### 8.2 Contingency Plans

| Risk | Contingency |
|------|-------------|
| Migration failure | Rollback migration, restore from backup |
| Stock mismatch | Run reconciliation job, alert admin |
| Payroll error | Manual adjustment option, audit trail |
| Billing failure | Grace period extension, manual billing |

---

## 9. Testing Strategy

### 9.1 Test Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │  ← 10% (critical paths only)
                    │   (10 tests)    │
                    └────────┬────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Integration    │ │  Integration    │ │  Integration    │
│    Tests        │ │    Tests        │ │    Tests        │
│ (Inventory)     │ │  (Payroll)      │ │  (Billing)      │
│  (30 tests)     │ │  (20 tests)     │ │  (20 tests)     │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         │                   │                   │
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│    Unit         │ │    Unit         │ │    Unit         │
│   Tests         │ │   Tests         │ │   Tests         │
│  (50 tests)     │ │  (40 tests)     │ │  (30 tests)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

### 9.2 Test Coverage Targets

| Component | Coverage Target |
|-----------|-----------------|
| InventoryService | 90% |
| FEFOService | 95% |
| PayrollCalculationService | 90% |
| BillingService | 85% |
| LeaveBalanceService | 90% |

### 9.3 Critical Test Cases

| # | Test Case | Priority | Phase |
|---|----------|----------|-------|
| 1 | Stock never goes negative | P0 | 1 |
| 2 | Every stock change creates movement | P0 | 1 |
| 3 | FEFO selects earliest expiry | P0 | 1 |
| 4 | Payroll calculates correct net | P0 | 2 |
| 5 | Leave balance cannot go negative | P0 | 2 |
| 6 | Invoice total = sum of payments | P0 | 4 |
| 7 | Subscription auto-renews if paid | P0 | 4 |
| 8 | Migration preserves all data | P0 | All |

---

## 10. Rollback Plan

### 10.1 Migration Rollback

Each migration includes a corresponding Down method:

```csharp
protected override void Down(MigrationBuilder migrationBuilder)
{
    // Rollback in reverse order of Up
    migrationBuilder.DropTable("inventory_movements");
    migrationBuilder.DropTable("inventory");
    migrationBuilder.DropTable("batches");
}
```

### 10.2 Data Rollback

```sql
-- Rollback inventory migration (restore to CurrentStock)
UPDATE products p
SET current_stock = COALESCE(
    (SELECT SUM(quantity) 
     FROM inventory i 
     WHERE i.product_id = p.id), 0
);

-- Then drop new tables
DROP TABLE IF EXISTS inventory_movements;
DROP TABLE IF EXISTS inventory;
DROP TABLE IF EXISTS batches;
```

### 10.3 Activation Criteria

| Check | Threshold | Action if Failed |
|-------|-----------|------------------|
| Stock reconciliation | 100% match | Rollback |
| Payroll calculation | 100% match | Rollback |
| Migration duration | < 30 min | Continue |
| Error rate | < 0.1% | Continue |

---

## Appendix A: File Change Summary

### New Files

```
BizCore.Domain/Entities/
├── Batch.cs
├── Inventory.cs
├── InventoryMovement.cs
├── SalaryComponent.cs
├── EmployeeSalaryComponent.cs
├── LeavePolicy.cs
├── EmployeeLeaveBalance.cs
├── Vendor.cs
├── ClientDocument.cs
├── PlatformInvoice.cs
└── PlatformPayment.cs

BizCore.Application/Interfaces/
├── IInventoryService.cs
├── IFEFOService.cs
├── ISalaryComponentService.cs
├── ILeavePolicyService.cs
├── ILeaveBalanceService.cs
├── IVendorService.cs
├── IDocumentService.cs
└── IBillingService.cs

BizCore.Infrastructure/Services/
├── InventoryService.cs
├── FEFOService.cs
├── SalaryComponentService.cs
├── LeavePolicyService.cs
├── LeaveBalanceService.cs
├── VendorService.cs
├── DocumentService.cs
└── BillingService.cs
```

### Modified Files

```
BizCore.Domain/Entities/
├── Product.cs (add feature flags)
├── POSTransactionItem.cs (add batch_id)
├── InvoiceItem.cs (add batch_id, warehouse_id)
├── Employee.cs (add salary_component_id)
├── Payroll.cs (expand)
└── PayrollItem.cs (new or expand)

BizCore.Infrastructure/Data/
├── AppDbContext.cs
└── Migrations/
    ├── *_AddBatches.cs
    ├── *_AddInventory.cs
    ├── *_AddInventoryMovements.cs
    ├── *_AddProductFeatureFlags.cs
    ├── *_AddSalaryComponents.cs
    ├── *_AddLeavePolicies.cs
    ├── *_AddVendors.cs
    ├── *_AddClientDocuments.cs
    ├── *_AddPlatformInvoices.cs
    └── *_AddPlatformPayments.cs

BizCore.API/Controllers/
├── BatchesController.cs
├── InventoryController.cs (update)
├── POSController.cs (update)
├── SalaryComponentsController.cs
├── LeavePoliciesController.cs
├── LeaveBalancesController.cs
├── VendorsController.cs
├── ClientDocumentsController.cs
└── BillingController.cs
```

---

## Appendix B: Sprint Planning

### Sprint 1: Batch & Inventory Foundation (Week 1-2)

| Task | Points | Assignee |
|------|--------|----------|
| 1.1-1.8 (Migrations) | 16 | Dev1 |
| 1.9-1.17 (Entities) | 16 | Dev2 |
| 1.18-1.23 (Services) | 24 | Dev1 |
| 1.24-1.27 (Controllers) | 14 | Dev2 |
| **Sprint Total** | **70** | |

### Sprint 2: HR Enhancement (Week 3-4)

| Task | Points | Assignee |
|------|--------|----------|
| 2.1-2.8 (Migrations/Seeding) | 10 | Dev1 |
| 2.9-2.15 (Entities) | 8 | Dev2 |
| 2.16-2.23 (Services) | 26 | Dev1 |
| 2.24-2.27 (Controllers) | 13 | Dev2 |
| **Sprint Total** | **57** | |

### Sprint 3: Vendor Separation (Week 5)

| Task | Points | Assignee |
|------|--------|----------|
| 3.1-3.3 (Migrations) | 3 | Dev1 |
| 3.4-3.6 (Entity/Service) | 5 | Dev2 |
| 3.7-3.8 (Service/Controller) | 5 | Dev1 |
| **Sprint Total** | **13** | |

### Sprint 4: Platform Billing (Week 6-7)

| Task | Points | Assignee |
|------|--------|----------|
| 4.1-4.7 (Migrations/Entities) | 10 | Dev1 |
| 4.8-4.11 (Services) | 14 | Dev2 |
| 4.12-4.15 (Controllers/Jobs) | 17 | Dev1 |
| **Sprint Total** | **41** | |

### Sprint 5: Stabilization (Week 8)

| Task | Points | Assignee |
|------|--------|----------|
| Integration Testing | 20 | Both |
| Bug Fixes | 10 | Both |
| Documentation | 5 | Dev2 |
| Deployment Prep | 5 | Dev1 |
| **Sprint Total** | **40** | |

**Total Project Points: 221**

---

**Document Status:** Draft - Pending Team Review  
**Next Review:** Sprint 1 Kickoff  
**Approval Required:** Technical Lead, Product Owner
