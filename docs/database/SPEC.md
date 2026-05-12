# BizCore Database Design Specification

**Version:** 1.0  
**Date:** 2026-04-16  
**Status:** Draft  
**Author:** Sisyphus (Database Architecture)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Corrected Database Architecture](#3-corrected-database-architecture)
4. [Master Schema Specification](#4-master-schema-specification)
5. [Tenant Schema Specification](#5-tenant-schema-specification)
6. [Entity Specifications](#6-entity-specifications)
7. [Index Specification](#7-index-specification)
8. [Migration Plan](#8-migration-plan)
9. [Implementation Guidelines](#9-implementation-guidelines)
10. [Appendix](#10-appendix)

---

## 1. Executive Summary

### 1.1 Purpose

This document specifies the corrected database design for BizCore, a multi-tenant SaaS ERP platform serving Nepal market. It replaces the current single-schema-with-TenantId approach with a hybrid architecture supporting both shared schemas (for Basic/Professional tiers) and isolated schemas (for Enterprise tier).

### 1.2 Scope

- Complete entity definitions for Master (public) schema
- Complete entity definitions for Tenant schemas
- Foreign key relationships and constraints
- Index strategy for performance
- Migration path from current design

### 1.3 Key Changes

| Category | Current | Corrected |
|----------|---------|-----------|
| Multi-tenancy | Single schema + TenantId filtering | Hybrid: shared (Basic/Pro) + schema-per-tenant (Enterprise) |
| Batch tracking | Product.ExpiryDate (single) | `batches` table with batch numbers, expiry, cost |
| Inventory | Product.CurrentStock (aggregate) | `inventory` table (product + warehouse + batch) |
| Expense categories | String column | `expense_categories` table (hierarchical) |
| Vendors | `contacts` with type filter | Separate `vendors` table |
| Salary structure | Hardcoded in Employee | `salary_components` + `employee_salary_components` |
| Leave management | No policies | `leave_policies` + `employee_leave_balances` |
| Platform billing | None | `platform_invoices` + `platform_payments` |

---

## 2. Current State Analysis

### 2.1 Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL: bizcore_db                                 │
├─────────────────────────────────────────────────────────┤
│  public schema                                          │
│  ├── Identity tables (AspNet*)                         │
│  ├── businesses                                        │
│  ├── contacts, parties                                 │
│  ├── products (with CurrentStock)                      │
│  ├── invoices, invoice_items                           │
│  ├── employees, attendance, payroll                    │
│  ├── pos_sessions, pos_transactions                   │
│  ├── warehouses                                        │
│  ├── subscription_plans (NEW)                         │
│  ├── client_subscriptions (NEW)                       │
│  └── [all with TenantId column + global filters]      │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Problems Identified

#### 2.2.1 Multi-Tenancy Strategy Issue

**Problem:** All tenants share the same schema with `TenantId` column and EF Core global query filters.

**Risks:**
- Data leakage if query filter misconfigured
- No true isolation for Enterprise clients requiring compliance
- Performance degradation at scale (all tenants in same indexes)
- Schema migrations affect all tenants simultaneously

**Severity:** High

#### 2.2.2 Batch Tracking Missing

**Current Implementation:**
```csharp
// Product.cs
public bool TrackExpiry { get; set; } = false;
public DateTime? ExpiryDate { get; set; }  // Single expiry per product
```

**Missing:**
- Batch numbers
- Multiple batches per product with different expiry dates
- Cost price per batch
- Manufacturing dates
- FEFO (First Expiry First Out) support
- Batch-level recalls

**Severity:** High (for retail/pharma clients)

#### 2.2.3 Inventory Model Incorrect

**Current Implementation:**
```csharp
// Product.cs
public int CurrentStock { get; set; }  // Single aggregate number
```

**Problems:**
- Stock not broken down by warehouse
- Stock not broken down by batch
- No tracking of reserved quantities
- No audit trail of movements

**Severity:** Critical

#### 2.2.4 Expense Categories as Strings

**Current Implementation:**
```csharp
// Expense.cs
public string Category { get; set; }  // "Rent", "Electricity", etc.
```

**Problems:**
- No hierarchy (parent/child categories)
- Typos and inconsistencies
- No category management UI
- Cannot track category-wise spending trends

**Severity:** Medium

#### 2.2.5 Missing Tables

| Required | Current Status |
|----------|----------------|
| `staff_users` | ❌ Using ApplicationUser |
| `client_documents` | ❌ Fields on Business |
| `platform_invoices` | ❌ None |
| `platform_payments` | ❌ None |
| `vendor` | ❌ Using Contact |
| `salary_components` | ❌ Hardcoded in Employee |
| `leave_policies` | ❌ None |
| `product_variants` | ❌ None |
| `inventory_movements` | ⚠️ Partial, no batch tracking |

### 2.3 Migration History

| Date | Migration | Tables Created |
|------|-----------|----------------|
| 2026-03-15 | Initial | AspNet*, Contacts, Parties, Businesses, Invoices, KhataEntries, Branches |
| 2026-03-15 | Phase2_Inventory | Categories, Products, Warehouses, StockMovements, PurchaseOrders, POSSessions |
| 2026-03-17 | AddEmployeeNepalFields | Employees (updated) |
| 2026-03-18 | AddExpenseModule | BankAccounts, Expenses, BankTransactions |
| 2026-03-18 | AddLoginHistory | UserLoginHistories, SuperAdminAuditLogs |
| 2026-03-26 | ModularUpdate | Modules, Permissions, TenantModules, FeatureFlags, Merchants, DeliveryPartners |
| 2026-04-16 | AddSubscriptionTables | SubscriptionPlans, BusinessSubscriptions |

---

## 3. Corrected Database Architecture

### 3.1 Hybrid Multi-Tenancy Strategy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BIZCORE DATABASE ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    MASTER DATABASE (public schema)                    │    │
│  ├─────────────────────────────────────────────────────────────────────┤    │
│  │  Staff & SuperAdmin                                                  │    │
│  │  ├── staff_users                                                     │    │
│  │  ├── permissions                                                     │    │
│  │  └── role_permissions                                                │    │
│  │                                                                       │    │
│  │  Subscription Management                                              │    │
│  │  ├── subscription_plans                                              │    │
│  │  ├── clients                                                         │    │
│  │  ├── client_subscriptions                                            │    │
│  │  ├── client_documents                                                │    │
│  │  ├── platform_invoices                                                │    │
│  │  └── platform_payments                                                │    │
│  │                                                                       │    │
│  │  Module Configuration                                                 │    │
│  │  ├── modules                                                         │    │
│  │  └── client_modules                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │          TIER: BASIC / PROFESSIONAL (shared schema)                  │    │
│  │                                                                       │    │
│  │  tenant_data (all tables with TenantId column)                       │    │
│  │  ├── users, categories, products, batches                            │    │
│  │  ├── warehouses, inventory, inventory_movements                       │    │
│  │  ├── vendors, contacts, invoices, invoice_items                       │    │
│  │  ├── pos_sessions, pos_transactions                                  │    │
│  │  ├── employees, attendance, leave_requests, payroll                   │    │
│  │  ├── projects, tasks, timesheets                                     │    │
│  │  ├── expenses, expense_categories                                    │    │
│  │  ├── bank_accounts, bank_transactions                                │    │
│  │  └── damaged_goods, merchants, delivery_partners                     │    │
│  │                                                                       │    │
│  │  + EF Core Global Query Filters: TenantId = current_tenant          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │          TIER: ENTERPRISE (schema-per-tenant)                       │    │
│  │                                                                       │    │
│  │  schema: tenant_{client_slug}                                        │    │
│  │  ├── Same tables as shared schema                                    │    │
│  │  ├── NO TenantId column (inherent to schema)                         │    │
│  │  └── Complete data isolation                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow

```
┌──────────────┐      ┌──────────────────┐      ┌─────────────────────┐
│   Client     │ ───► │   API Gateway    │ ───► │  Tenant Middleware  │
│   Request    │      │                  │      │  (Extract tid claim) │
└──────────────┘      └──────────────────┘      └──────────┬──────────┘
                                                          │
                                                          ▼
                                              ┌─────────────────────┐
                                              │   Tenant Service    │
                                              │  - GetTenantId()    │
                                              │  - SetTenantId()    │
                                              └──────────┬──────────┘
                                                         │
                                    ┌────────────────────┼────────────────────┐
                                    │                    │                    │
                                    ▼                    ▼                    ▼
                          ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
                          │  Basic/Pro     │  │   Enterprise   │  │    Master      │
                          │  (Shared DB)   │  │  (Own Schema)  │  │    (Always)    │
                          │                │  │                │  │                │
                          │ - Filter by    │  │ - Set search_  │  │ - No filtering │
                          │   TenantId     │  │   path         │  │ - Client ops   │
                          │ - EF Core      │  │ - Direct       │  │ - Subscriptions│
                          │   Global       │  │   schema access│  │ - Module config│
                          │   Filters      │  │                │  │                │
                          └────────────────┘  └────────────────┘  └────────────────┘
```

### 3.3 Schema Selection Logic

```csharp
public class TenantSchemaSelector
{
    public string GetSchema(TenantInfo tenant)
    {
        return tenant.Tier switch
        {
            TenantTier.Enterprise => $"tenant_{tenant.Slug}",
            _ => "public"  // Basic/Professional share public schema
        };
    }
}
```

---

## 4. Master Schema Specification

### 4.1 Overview

The Master schema contains platform-level data shared across all tenants but not tenant-specific business data.

### 4.2 Tables

#### 4.2.1 `staff_users`

SuperAdmin platform staff (support, billing, developers).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| email | VARCHAR(255) | NOT NULL, UNIQUE | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| role | VARCHAR(50) | NOT NULL, DEFAULT 'Support' | Admin, Support, Billing, Developer |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| deleted_at | TIMESTAMPTZ | | Hard delete timestamp |

**Indexes:**
- `IX_staff_users_email` ON (email)

---

#### 4.2.2 `subscription_plans`

Available subscription pricing tiers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Plan display name |
| code | VARCHAR(50) | NOT NULL, UNIQUE | Plan code (basic, professional, enterprise) |
| description | TEXT | | Plan description |
| monthly_price | DECIMAL(18,2) | NOT NULL | Monthly price |
| annual_price | DECIMAL(18,2) | NOT NULL | Annual price |
| max_users | INT | NOT NULL | Maximum users allowed |
| max_products | INT | NOT NULL | Maximum products |
| max_invoices | INT | NOT NULL | Maximum invoices/month |
| max_warehouses | INT | NOT NULL | Maximum warehouses |
| allow_pos | BOOLEAN | NOT NULL, DEFAULT true | POS module |
| allow_inventory | BOOLEAN | NOT NULL, DEFAULT true | Inventory module |
| allow_invoices | BOOLEAN | NOT NULL, DEFAULT true | Invoices module |
| allow_hr | BOOLEAN | NOT NULL, DEFAULT false | HR module |
| allow_projects | BOOLEAN | NOT NULL, DEFAULT false | Projects module |
| allow_reports | BOOLEAN | NOT NULL, DEFAULT false | Reports module |
| allow_multiple_branches | BOOLEAN | NOT NULL, DEFAULT false | Multi-branch |
| allow_api | BOOLEAN | NOT NULL, DEFAULT false | API access |
| allow_batch_tracking | BOOLEAN | NOT NULL, DEFAULT false | Batch/Expiry tracking |
| allow_multi_warehouse | BOOLEAN | NOT NULL, DEFAULT false | Multi-warehouse |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Plan available |
| is_trial | BOOLEAN | NOT NULL, DEFAULT false | Trial plan |
| trial_days | INT | NOT NULL, DEFAULT 14 | Trial duration |
| sort_order | INT | NOT NULL, DEFAULT 0 | Display order |
| features_json | JSONB | | Additional features |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_subscription_plans_code` ON (code)
- `IX_subscription_plans_is_active` ON (is_active)

---

#### 4.2.3 `clients`

Tenant businesses (client organizations).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| tenant_id | UUID | NOT NULL, UNIQUE | Tenant identifier |
| name | VARCHAR(255) | NOT NULL | Business name |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | URL slug (subdomain) |
| business_type | VARCHAR(100) | | Type of business |
| email | VARCHAR(255) | | Contact email |
| phone | VARCHAR(50) | | Contact phone |
| address | TEXT | | Street address |
| city | VARCHAR(100) | | City |
| district | VARCHAR(100) | | District |
| country | VARCHAR(100) | DEFAULT 'Nepal' | Country |
| pan_number | VARCHAR(50) | | PAN number |
| is_vat_registered | BOOLEAN | NOT NULL, DEFAULT false | VAT status |
| vat_number | VARCHAR(50) | | VAT number |
| registration_number | VARCHAR(100) | | Registration number |
| logo_url | TEXT | | Logo image URL |
| website | VARCHAR(255) | | Website URL |
| currency | VARCHAR(10) | NOT NULL, DEFAULT 'NPR' | Currency code |
| fiscal_year_start | VARCHAR(20) | NOT NULL, DEFAULT 'Shrawan' | Nepali fiscal start |
| timezone | VARCHAR(50) | DEFAULT 'Asia/Kathmandu' | Timezone |
| date_format | VARCHAR(20) | DEFAULT 'YYYY-MM-DD' | Date format |
| owner_user_id | UUID | NOT NULL | FK to ApplicationUser |
| primary_contact_name | VARCHAR(200) | | Contact person |
| primary_contact_phone | VARCHAR(50) | | Contact phone |
| primary_contact_email | VARCHAR(255) | | Contact email |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'Active' | Active, Suspended, Churned |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_clients_tenant_id` ON (tenant_id)
- `IX_clients_slug` ON (slug) UNIQUE
- `IX_clients_status` ON (status)
- `IX_clients_owner_user_id` ON (owner_user_id)

---

#### 4.2.4 `client_subscriptions`

Active subscription for each client.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| client_id | UUID | NOT NULL, FK | FK to clients |
| plan_id | UUID | NOT NULL, FK | FK to subscription_plans |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'Active' | Trial, Active, Suspended, Expired |
| billing_cycle | VARCHAR(20) | NOT NULL, DEFAULT 'Monthly' | Monthly, Annual |
| start_date | TIMESTAMPTZ | NOT NULL | Subscription start |
| current_period_start | TIMESTAMPTZ | NOT NULL | Current billing period start |
| current_period_end | TIMESTAMPTZ | NOT NULL | Current billing period end |
| trial_end_date | TIMESTAMPTZ | | Trial expiry |
| cancelled_at | TIMESTAMPTZ | | Cancellation timestamp |
| cancellation_reason | TEXT | | Reason for cancellation |
| cancelled_by | UUID | | Who cancelled |
| auto_renew | BOOLEAN | NOT NULL, DEFAULT true | Auto-renewal |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_client_subscriptions_client_id` ON (client_id)
- `IX_client_subscriptions_plan_id` ON (plan_id)
- `IX_client_subscriptions_status` ON (status)
- `UX_client_subscriptions_active` ON (client_id) WHERE status IN ('Active', 'Trial')

**Constraints:**
- One active subscription per client (partial unique index)

---

#### 4.2.5 `client_documents`

Business documents (PAN, registration, logo, agreements).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| client_id | UUID | NOT NULL, FK | FK to clients |
| document_type | VARCHAR(50) | NOT NULL | PAN, Registration, Logo, Agreement |
| document_name | VARCHAR(255) | NOT NULL | Document display name |
| file_url | TEXT | NOT NULL | File storage URL |
| file_size | INT | | File size in bytes |
| mime_type | VARCHAR(100) | | MIME type |
| uploaded_by | UUID | | Uploader user ID |
| verified_at | TIMESTAMPTZ | | Verification timestamp |
| verified_by | UUID | | Verifier user ID |
| verification_status | VARCHAR(50) | DEFAULT 'Pending' | Pending, Verified, Rejected |
| rejection_reason | TEXT | | Rejection reason |
| created_at | TIMESTAMPTZ | NOT NULL | Upload timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_client_documents_client_id` ON (client_id)
- `IX_client_documents_type` ON (document_type)

---

#### 4.2.6 `platform_invoices`

Invoices for subscription billing.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| invoice_number | VARCHAR(50) | NOT NULL, UNIQUE | Invoice number |
| client_id | UUID | NOT NULL, FK | FK to clients |
| subscription_id | UUID | FK | FK to client_subscriptions |
| invoice_type | VARCHAR(50) | NOT NULL | Subscription, Addon, Overage |
| period_start | TIMESTAMPTZ | | Billing period start |
| period_end | TIMESTAMPTZ | | Billing period end |
| subtotal | DECIMAL(18,2) | NOT NULL, DEFAULT 0 | Subtotal |
| tax_amount | DECIMAL(18,2) | NOT NULL, DEFAULT 0 | Tax amount |
| total_amount | DECIMAL(18,2) | NOT NULL | Total |
| currency | VARCHAR(10) | NOT NULL, DEFAULT 'NPR' | Currency |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'Draft' | Draft, Sent, Paid, Overdue |
| issue_date | DATE | NOT NULL | Invoice date |
| due_date | DATE | NOT NULL | Payment due date |
| paid_at | TIMESTAMPTZ | | Payment timestamp |
| payment_method | VARCHAR(50) | | Payment method |
| payment_reference | VARCHAR(255) | | Payment reference |
| notes | TEXT | | Internal notes |
| created_by | UUID | | Creator user ID |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_platform_invoices_client_id` ON (client_id)
- `IX_platform_invoices_status` ON (status)
- `IX_platform_invoices_invoice_number` ON (invoice_number)

---

#### 4.2.7 `platform_payments`

Payments received from clients.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| invoice_id | UUID | FK | FK to platform_invoices |
| client_id | UUID | NOT NULL, FK | FK to clients |
| amount | DECIMAL(18,2) | NOT NULL | Payment amount |
| payment_method | VARCHAR(50) | NOT NULL | BankTransfer, eSewa, Khalti |
| transaction_reference | VARCHAR(255) | | Bank transaction ID |
| transaction_id | VARCHAR(255) | | Payment gateway ID |
| paid_at | TIMESTAMPTZ | NOT NULL | Payment timestamp |
| received_by | UUID | | Receiver staff ID |
| bank_name | VARCHAR(100) | | Bank name |
| bank_receipt_number | VARCHAR(100) | | Bank receipt |
| notes | TEXT | | Payment notes |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_platform_payments_client_id` ON (client_id)
- `IX_platform_payments_invoice_id` ON (invoice_id)
- `IX_platform_payments_paid_at` ON (paid_at)

---

#### 4.2.8 `modules`

Available platform modules/features.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Module display name |
| code | VARCHAR(50) | NOT NULL, UNIQUE | Module code |
| description | TEXT | | Module description |
| icon | VARCHAR(50) | | UI icon name |
| sort_order | INT | NOT NULL, DEFAULT 0 | Display order |
| is_core | BOOLEAN | NOT NULL, DEFAULT false | Core module (always enabled) |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Module available |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_modules_code` ON (code) UNIQUE

---

#### 4.2.9 `client_modules`

Module enablement per client.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| client_id | UUID | NOT NULL, FK | FK to clients |
| module_id | UUID | NOT NULL, FK | FK to modules |
| is_enabled | BOOLEAN | NOT NULL, DEFAULT true | Module status |
| enabled_at | TIMESTAMPTZ | | Enable timestamp |
| disabled_at | TIMESTAMPTZ | | Disable timestamp |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_client_modules_client_id` ON (client_id)
- `IX_client_modules_module_id` ON (module_id)

**Constraints:**
- UNIQUE(client_id, module_id)

---

#### 4.2.10 `permissions`

Available permissions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Permission name |
| code | VARCHAR(100) | NOT NULL, UNIQUE | Permission code |
| description | TEXT | | Permission description |
| module_code | VARCHAR(50) | | Related module |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |

**Indexes:**
- `IX_permissions_code` ON (code) UNIQUE

---

#### 4.2.11 `role_permissions`

Role-permission mappings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| role_name | VARCHAR(100) | NOT NULL | Role name |
| permission_id | UUID | NOT NULL, FK | FK to permissions |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |

**Indexes:**
- `IX_role_permissions_role_name` ON (role_name)

**Constraints:**
- UNIQUE(role_name, permission_id)

---

## 5. Tenant Schema Specification

### 5.1 Overview

Each tenant schema contains all business data for a client. For Enterprise tier, this is a separate PostgreSQL schema. For Basic/Professional tier, this is the shared `tenant_data` namespace with TenantId filtering.

### 5.2 Entity Hierarchy

```
Tenant Schema Entities
├── Organization
│   ├── branches
│   ├── users
│   └── user_branch_access
├── Inventory
│   ├── categories (hierarchical)
│   ├── products
│   ├── product_variants
│   ├── warehouses
│   ├── batches
│   ├── inventory
│   └── inventory_movements
├── Supply Chain
│   ├── vendors
│   ├── contacts
│   ├── purchase_orders
│   ├── purchase_order_items
│   ├── purchase_receipts
│   └── warehouse_transfers
├── Sales
│   ├── invoices
│   ├── invoice_items
│   ├── invoice_payments
│   ├── pos_sessions
│   ├── pos_transactions
│   ├── pos_transaction_items
│   └── khata_entries
├── HR
│   ├── employees
│   ├── salary_components
│   ├── employee_salary_components
│   ├── leave_policies
│   ├── employee_leave_balances
│   ├── attendance
│   ├── leave_requests
│   └── payroll
├── Projects
│   ├── projects
│   ├── project_tasks
│   └── timesheets
├── Finance
│   ├── expense_categories
│   ├── expenses
│   ├── expense_payments
│   ├── bank_accounts
│   └── bank_transactions
└── Operations
    ├── damaged_goods
    ├── merchants
    └── delivery_partners
```

---

## 6. Entity Specifications

### 6.1 Organization Entities

#### 6.1.1 `branches`

Business locations/branches.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(200) | NOT NULL | Branch name |
| code | VARCHAR(50) | | Branch code |
| address | TEXT | | Branch address |
| phone | VARCHAR(50) | | Contact phone |
| email | VARCHAR(255) | | Contact email |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Branch status |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| created_by | UUID | | Creator user ID |

**Indexes:**
- `IX_branches_code` ON (code)

---

#### 6.1.2 `users`

Tenant users (employees with login access).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| employee_id | UUID | FK | FK to employees |
| email | VARCHAR(255) | NOT NULL | Login email |
| password_hash | VARCHAR(255) | NOT NULL | Bcrypt hash |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| phone | VARCHAR(50) | | Phone number |
| role | VARCHAR(50) | NOT NULL | Admin, Accountant, Sales, etc. |
| branch_id | UUID | FK | FK to branches |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Account status |
| is_first_login | BOOLEAN | NOT NULL, DEFAULT true | First login flag |
| last_login_at | TIMESTAMPTZ | | Last login timestamp |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| created_by | UUID | | Creator user ID |

**Indexes:**
- `IX_users_email` ON (email) UNIQUE
- `IX_users_employee_id` ON (employee_id)
- `IX_users_role` ON (role)

**Relationships:**
- user_id in employees links back to this table

---

#### 6.1.3 `user_branch_access`

Multi-branch user access.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| user_id | UUID | NOT NULL, FK | FK to users |
| branch_id | UUID | NOT NULL, FK | FK to branches |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |

**Constraints:**
- UNIQUE(user_id, branch_id)

---

### 6.2 Inventory Entities

#### 6.2.1 `categories`

Product categories with hierarchy.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| parent_id | UUID | FK | FK to categories (self-reference) |
| name | VARCHAR(200) | NOT NULL | Category name |
| code | VARCHAR(50) | | Category code |
| description | TEXT | | Category description |
| image_url | TEXT | | Category image |
| sort_order | INT | NOT NULL, DEFAULT 0 | Display order |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Category status |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| created_by | UUID | | Creator user ID |

**Indexes:**
- `IX_categories_parent_id` ON (parent_id)
- `IX_categories_name` ON (name)

**Example Hierarchy:**
```
All Products
├── Electronics
│   ├── Mobile Phones
│   │   ├── Smartphones
│   │   └── Feature Phones
│   └── Accessories
│       ├── Chargers
│       └── Cases
└── Groceries
    ├── Fresh Produce
    └── Packaged Goods
```

---

#### 6.2.2 `products`

Product catalog.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| category_id | UUID | FK | FK to categories |
| name | VARCHAR(255) | NOT NULL | Product name |
| sku | VARCHAR(100) | NOT NULL | Stock keeping unit |
| barcode | VARCHAR(100) | | Barcode (EAN/UPC) |
| description | TEXT | | Product description |
| brand | VARCHAR(100) | | Brand name |
| hsn_code | VARCHAR(20) | | HSN code for tax |
| unit | VARCHAR(50) | NOT NULL, DEFAULT 'pcs' | Unit of measure |
| cost_price | DECIMAL(18,4) | NOT NULL, DEFAULT 0 | Purchase cost |
| selling_price | DECIMAL(18,4) | NOT NULL, DEFAULT 0 | Selling price |
| mrp | DECIMAL(18,4) | | Maximum retail price |
| tax_rate | DECIMAL(5,2) | NOT NULL, DEFAULT 0 | Tax percentage |
| is_vat_applicable | BOOLEAN | NOT NULL, DEFAULT true | VAT applicability |
| reorder_quantity | INT | NOT NULL, DEFAULT 10 | Reorder level |
| low_stock_threshold | INT | NOT NULL, DEFAULT 10 | Low stock alert |
| enable_batch_tracking | BOOLEAN | NOT NULL, DEFAULT false | Batch tracking flag |
| enable_warehouse_tracking | BOOLEAN | NOT NULL, DEFAULT false | Warehouse tracking |
| enable_expiry_tracking | BOOLEAN | NOT NULL, DEFAULT false | Expiry tracking |
| enable_serial_number | BOOLEAN | NOT NULL, DEFAULT false | Serial number tracking |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Product status |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| created_by | UUID | | Creator user ID |

**Indexes:**
- `UX_products_sku` ON (sku) UNIQUE
- `IX_products_category_id` ON (category_id)
- `IX_products_barcode` ON (barcode)
- `IX_products_name` ON (name)

**Feature Flags:**
The `enable_*` columns control which features are active per product, allowing granular control based on subscription plan.

---

#### 6.2.3 `product_variants`

Product variants (size, color, etc.).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| product_id | UUID | NOT NULL, FK | FK to products |
| sku | VARCHAR(100) | NOT NULL | Variant SKU |
| name | VARCHAR(255) | NOT NULL | Variant name |
| attributes | JSONB | NOT NULL | {"size": "XL", "color": "Red"} |
| cost_price | DECIMAL(18,4) | NOT NULL, DEFAULT 0 | Variant cost |
| selling_price | DECIMAL(18,4) | NOT NULL, DEFAULT 0 | Variant price |
| mrp | DECIMAL(18,4) | | Variant MRP |
| barcode | VARCHAR(100) | | Variant barcode |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Variant status |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| deleted_at | TIMESTAMPTZ | | Hard delete timestamp |

**Constraints:**
- UNIQUE(product_id, sku)

**Indexes:**
- `IX_product_variants_product_id` ON (product_id)

---

#### 6.2.4 `warehouses`

Storage locations.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(200) | NOT NULL | Warehouse name |
| code | VARCHAR(50) | | Warehouse code |
| address | TEXT | | Warehouse address |
| city | VARCHAR(100) | | City |
| phone | VARCHAR(50) | | Contact phone |
| email | VARCHAR(255) | | Contact email |
| is_default | BOOLEAN | NOT NULL, DEFAULT false | Default warehouse |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Warehouse status |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| created_by | UUID | | Creator user ID |

**Indexes:**
- `IX_warehouses_code` ON (code)

**Note:** At least one warehouse must have `is_default = true`.

---

#### 6.2.5 `batches`

Batch tracking for products with expiry.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| product_id | UUID | NOT NULL, FK | FK to products |
| batch_number | VARCHAR(100) | NOT NULL | Batch identifier |
| manufacturing_date | DATE | | Manufacturing date |
| expiry_date | DATE | | Expiry date |
| manufacturing_date_supplier | DATE | | Supplier MFD |
| supplier_batch_number | VARCHAR(100) | | Supplier batch ref |
| cost_price | DECIMAL(18,4) | | Batch-specific cost |
| notes | TEXT | | Batch notes |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Batch status |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| deleted_at | TIMESTAMPTZ | | Hard delete timestamp |
| created_by | UUID | | Creator user ID |

**Constraints:**
- UNIQUE(product_id, batch_number)

**Indexes:**
- `IX_batches_product_id` ON (product_id)
- `IX_batches_batch_number` ON (batch_number)
- `IX_batches_expiry_date` ON (expiry_date) WHERE expiry_date IS NOT NULL

**FEFO Logic:**
```sql
-- Get inventory for a product using FEFO
SELECT i.*, b.expiry_date
FROM inventory i
JOIN batches b ON i.batch_id = b.id
WHERE i.product_id = $1 AND i.quantity > 0
ORDER BY b.expiry_date ASC NULLS LAST
LIMIT $2;
```

---

#### 6.2.6 `inventory`

Stock levels by product/warehouse/batch.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| product_id | UUID | NOT NULL, FK | FK to products |
| warehouse_id | UUID | NOT NULL, FK | FK to warehouses |
| batch_id | UUID | FK | FK to batches (nullable for non-batch items) |
| quantity | INT | NOT NULL, DEFAULT 0 | Available quantity |
| reserved_quantity | INT | NOT NULL, DEFAULT 0 | Reserved for orders |
| available_quantity | INT | GENERATED | quantity - reserved_quantity |
| reorder_point | INT | NOT NULL, DEFAULT 10 | Reorder level |
| last_stock_check | TIMESTAMPTZ | | Last physical count |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| deleted_at | TIMESTAMPTZ | | Hard delete timestamp |

**Constraints:**
- UNIQUE(product_id, warehouse_id, batch_id)

**Indexes:**
- `IX_inventory_product_id` ON (product_id)
- `IX_inventory_warehouse_id` ON (warehouse_id)
- `IX_inventory_batch_id` ON (batch_id)
- `IX_inventory_product_warehouse` ON (product_id, warehouse_id)
- `IX_inventory_low_stock` ON (quantity, reorder_point) WHERE quantity <= reorder_point

**Calculated Column:**
```sql
available_quantity INT GENERATED ALWAYS AS (quantity - reserved_quantity) STORED
```

---

#### 6.2.7 `inventory_movements`

Audit trail for all stock changes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| inventory_id | UUID | NOT NULL, FK | FK to inventory |
| product_id | UUID | NOT NULL, FK | FK to products |
| warehouse_id | UUID | NOT NULL, FK | FK to warehouses |
| batch_id | UUID | FK | FK to batches |
| movement_type | VARCHAR(50) | NOT NULL | Purchase, Sale, Return, Adjustment, Transfer, Damage |
| quantity | INT | NOT NULL | Positive = in, Negative = out |
| balance_after | INT | NOT NULL | Stock after movement |
| reference_type | VARCHAR(50) | | PurchaseOrder, Invoice, etc. |
| reference_id | UUID | | Reference document ID |
| reference_number | VARCHAR(100) | | Reference document number |
| notes | TEXT | | Movement notes |
| reason | VARCHAR(100) | | Reason code |
| moved_at | TIMESTAMPTZ | NOT NULL | Movement timestamp |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| created_by | UUID | | User who created |

**Indexes:**
- `IX_inventory_movements_inventory_id` ON (inventory_id)
- `IX_inventory_movements_product_id` ON (product_id)
- `IX_inventory_movements_movement_type` ON (movement_type)
- `IX_inventory_movements_reference` ON (reference_type, reference_id)
- `IX_inventory_movements_moved_at` ON (moved_at)

**Movement Types:**
| Type | Description | Effect |
|------|-------------|--------|
| Purchase | Stock received from vendor | +quantity |
| Sale | Stock sold to customer | -quantity |
| Return | Customer return | +quantity |
| Adjustment | Manual stock adjustment | +/-quantity |
| Transfer | Warehouse transfer (out) | -quantity |
| Received | Warehouse transfer (in) | +quantity |
| Damage | Damaged goods | -quantity |
| Expired | Expired goods written off | -quantity |

---

#### 6.2.8 `warehouse_transfers`

Inter-warehouse stock transfers.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| transfer_number | VARCHAR(50) | NOT NULL, UNIQUE | Transfer number |
| from_warehouse_id | UUID | NOT NULL, FK | Source warehouse |
| to_warehouse_id | UUID | NOT NULL, FK | Destination warehouse |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'Pending' | Pending, InTransit, Received, Cancelled |
| sent_at | TIMESTAMPTZ | | Departure timestamp |
| received_at | TIMESTAMPTZ | | Arrival timestamp |
| sent_by | UUID | | User who sent |
| received_by | UUID | | User who received |
| notes | TEXT | | Transfer notes |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| deleted_at | TIMESTAMPTZ | | Hard delete timestamp |
| created_by | UUID | | Creator user ID |

**Indexes:**
- `IX_warehouse_transfers_number` ON (transfer_number) UNIQUE
- `IX_warehouse_transfers_status` ON (status)

**Transfer Items:** `warehouse_transfer_items`

---

### 6.3 HR Entities

#### 6.3.1 `employees`

Employee records.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| employee_code | VARCHAR(50) | NOT NULL, UNIQUE | Employee ID code |
| first_name | VARCHAR(100) | NOT NULL | First name |
| last_name | VARCHAR(100) | NOT NULL | Last name |
| email | VARCHAR(255) | | Email address |
| phone | VARCHAR(50) | | Phone number |
| date_of_birth | DATE | | Date of birth |
| gender | VARCHAR(20) | | Gender |
| marital_status | VARCHAR(20) | | Marital status |
| address | TEXT | | Home address |
| emergency_contact_name | VARCHAR(200) | | Emergency contact |
| emergency_contact_phone | VARCHAR(50) | | Emergency phone |
| emergency_contact_relation | VARCHAR(50) | | Relationship |
| position | VARCHAR(100) | NOT NULL | Job title |
| department | VARCHAR(100) | | Department |
| branch_id | UUID | FK | FK to branches |
| user_id | UUID | FK | FK to users (login) |
| join_date | DATE | NOT NULL | Joining date |
| employment_type | VARCHAR(50) | NOT NULL | FullTime, PartTime, Contract |
| status | VARCHAR(50) | NOT NULL, DEFAULT 'Active' | Active, OnLeave, Terminated |
| termination_date | DATE | | Termination date |
| termination_reason | TEXT | | Termination reason |
| basic_salary | DECIMAL(18,4) | NOT NULL | Base salary |
| salary_component_id | UUID | FK | FK to salary_components |
| payment_mode | VARCHAR(50) | | Bank, Cash, Cheque |
| bank_account_number | VARCHAR(100) | | Bank account |
| bank_name | VARCHAR(100) | | Bank name |
| bank_branch | VARCHAR(100) | | Branch name |
| pan_number | VARCHAR(50) | | PAN number |
| is_tds_applicable | BOOLEAN | NOT NULL, DEFAULT false | TDS applicability |
| pf_number | VARCHAR(50) | | PF account number |
| esi_number | VARCHAR(50) | | ESI number |
| aadhar_number | VARCHAR(50) | | Aadhar number |
| citizenship_number | VARCHAR(50) | | Citizenship number |
| leave_balance | JSONB | | {"annual": 18, "sick": 12} |
| shift_id | UUID | FK | FK to shifts |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Record status |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| deleted_at | TIMESTAMPTZ | | Hard delete timestamp |
| created_by | UUID | | Creator user ID |

**Indexes:**
- `IX_employees_employee_code` ON (employee_code) UNIQUE
- `IX_employees_email` ON (email)
- `IX_employees_status` ON (status)
- `IX_employees_branch_id` ON (branch_id)

---

#### 6.3.2 `salary_components`

Allowance and deduction definitions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Component name |
| code | VARCHAR(50) | NOT NULL, UNIQUE | Component code |
| component_type | VARCHAR(50) | NOT NULL | Allowance, Deduction |
| calculation_type | VARCHAR(50) | NOT NULL, DEFAULT 'Fixed' | Fixed, Percentage |
| value | DECIMAL(18,4) | NOT NULL, DEFAULT 0 | Amount or percentage |
| percentage_of | VARCHAR(50) | | Base for percentage (BasicSalary, GrossSalary) |
| is_taxable | BOOLEAN | NOT NULL, DEFAULT true | Taxable component |
| is_pf_applicable | BOOLEAN | NOT NULL, DEFAULT true | PF applicable |
| is_esi_applicable | BOOLEAN | NOT NULL, DEFAULT true | ESI applicable |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Component status |
| sort_order | INT | NOT NULL, DEFAULT 0 | Display order |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| deleted_at | TIMESTAMPTZ | | Hard delete timestamp |

**Indexes:**
- `IX_salary_components_code` ON (code) UNIQUE

**Standard Components:**
| Code | Name | Type | Calculation |
|------|------|------|-------------|
| HRA | House Rent Allowance | Allowance | Percentage (40% of Basic) |
| TA | Transport Allowance | Allowance | Fixed |
| MA | Medical Allowance | Allowance | Fixed |
| DA | Dearness Allowance | Allowance | Percentage |
| PF | Provident Fund | Deduction | Percentage (12% of Basic) |
| ESI | Employee State Insurance | Deduction | Percentage (0.75% of Gross) |
| TDS | Tax Deducted at Source | Deduction | Percentage (based on slabs) |
| PT | Professional Tax | Deduction | Fixed |

---

#### 6.3.3 `leave_policies`

Leave type definitions and rules.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Primary key |
| name | VARCHAR(100) | NOT NULL | Policy name |
| code | VARCHAR(50) | NOT NULL, UNIQUE | Policy code |
| leave_type | VARCHAR(50) | NOT NULL | Annual, Sick, Casual, Maternity, etc. |
| paid_leave | BOOLEAN | NOT NULL, DEFAULT true | Paid vs unpaid |
| max_days_per_year | INT | | Annual entitlement |
| max_consecutive_days | INT | | Max days at once |
| max_carry_forward | INT | | Carry forward limit |
| carry_forward_expiry_months | INT | | CF expiry period |
| is_active | BOOLEAN | NOT NULL, DEFAULT true | Policy status |
| is_encashable | BOOLEAN | NOT NULL, DEFAULT false | Can encash |
| created_at | TIMESTAMPTZ | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMPTZ | NOT NULL | Last update |
| is_deleted | BOOLEAN | NOT NULL, DEFAULT false | Soft delete |
| deleted_at | TIMESTAMPTZ | | Hard delete timestamp |

**Indexes:**
- `IX_leave_policies_code` ON (code) UNIQUE

**Standard Policies:**
| Code | Leave Type | Paid | Max Days | Carry Forward |
|------|------------|------|----------|---------------|
| ANNUAL | Annual Leave | Yes | 18 | 6 (expires Mar) |
| SICK | Sick Leave | Yes | 12 | 0 |
| CASUAL | Casual Leave | Yes | 6 | 0 |
| MATERNITY | Maternity Leave | Yes | 90 | 0 |
| PATERNITY | Paternity Leave | Yes | 15 | 0 |
| LOP | Loss of Pay | No | Unlimited | 0 |
| COMPOFF | Compensatory Off | Yes | Based on overtime | 30 |

---

## 7. Index Specification

### 7.1 Index Strategy

| Category | Strategy |
|----------|----------|
| Primary Keys | B-tree (default) |
| Foreign Keys | B-tree with Include for covering |
| Unique Constraints | B-tree Unique |
| Text Search | GIN for JSONB, trigram for LIKE |
| Range Queries | B-tree for dates, GiST for ranges |
| Compound Indexes | Leading column is most selective |

### 7.2 Critical Indexes

#### Master Schema

| Table | Index | Type | Columns | Purpose |
|-------|-------|------|---------|---------|
| clients | IX_clients_slug | UNIQUE | slug | Subdomain lookup |
| clients | IX_clients_owner_user_id | | owner_user_id | Owner queries |
| client_subscriptions | UX_client_subscriptions_active | PARTIAL | client_id WHERE status IN | Active subscription |
| platform_invoices | IX_platform_invoices_client_status | | client_id, status | Overdue aging |

#### Tenant Schema

| Table | Index | Type | Columns | Purpose |
|-------|-------|------|---------|---------|
| products | UX_products_sku | UNIQUE | sku | SKU lookup |
| products | IX_products_category | | category_id | Category browsing |
| batches | IX_batches_expiry | | expiry_date WHERE | Expiring stock alert |
| inventory | UX_inventory_pwb | UNIQUE | product_id, warehouse_id, batch_id | Stock lookup |
| inventory | IX_inventory_low_stock | | quantity, reorder_point WHERE | Low stock alerts |
| inventory_movements | IX_inv_movements_reference | | reference_type, reference_id | Document linking |
| employees | UX_employees_code | UNIQUE | employee_code | Employee lookup |
| attendance | UX_attendance_emp_date | UNIQUE | employee_id, attendance_date | Prevent duplicates |
| payroll | UX_payroll_emp_month | UNIQUE | employee_id, month, year | Prevent duplicates |
| invoices | UX_invoices_number | UNIQUE | invoice_number | Invoice lookup |
| invoices | IX_invoices_customer_status | | customer_id, status | Customer aging |
| pos_transactions | UX_pos_txn_number | UNIQUE | transaction_number | Receipt lookup |

---

## 8. Migration Plan

### 8.1 Phase 1: Core Infrastructure (Week 1-2)

#### 8.1.1 Add Batch Support

```sql
-- Create batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE,
    manufacturing_date DATE,
    cost_price DECIMAL(18,4),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    UNIQUE(product_id, batch_number)
);

CREATE INDEX IX_batches_product_id ON batches(product_id);
CREATE INDEX IX_batches_expiry_date ON batches(expiry_date) WHERE expiry_date IS NOT NULL;

-- Create inventory table
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    quantity INT NOT NULL DEFAULT 0,
    reserved_quantity INT NOT NULL DEFAULT 0,
    reorder_point INT NOT NULL DEFAULT 10,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    UNIQUE(product_id, warehouse_id, batch_id)
);

CREATE INDEX IX_inventory_product_warehouse ON inventory(product_id, warehouse_id);

-- Create inventory_movements table
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    batch_id UUID REFERENCES batches(id),
    movement_type VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    balance_after INT NOT NULL,
    reference_type VARCHAR(50),
    reference_id UUID,
    reference_number VARCHAR(100),
    notes TEXT,
    reason VARCHAR(100),
    moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID
);

CREATE INDEX IX_inv_movements_reference ON inventory_movements(reference_type, reference_id);

-- Add product feature flags
ALTER TABLE products ADD COLUMN enable_batch_tracking BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN enable_warehouse_tracking BOOLEAN NOT NULL DEFAULT false;

-- Add batch_id to POS items
ALTER TABLE pos_transaction_items ADD COLUMN batch_id UUID REFERENCES batches(id);

-- Add batch_id to invoice_items
ALTER TABLE invoice_items ADD COLUMN batch_id UUID REFERENCES batches(id);
ALTER TABLE invoice_items ADD COLUMN warehouse_id UUID REFERENCES warehouses(id);

-- Migrate CurrentStock to inventory
INSERT INTO inventory (product_id, warehouse_id, quantity, created_at, updated_at)
SELECT p.id, w.id, p.current_stock, NOW(), NOW()
FROM products p
CROSS JOIN warehouses w
WHERE w.is_default = true AND p.current_stock > 0;

-- Create initial inventory movements for migrated stock
INSERT INTO inventory_movements (inventory_id, product_id, warehouse_id, batch_id, movement_type, quantity, balance_after, moved_at, created_at)
SELECT i.id, i.product_id, i.warehouse_id, NULL, 'Adjustment', i.quantity, i.quantity, NOW(), NOW()
FROM inventory i;
```

#### 8.1.2 Add Expense Categories

```sql
-- Create expense_categories table
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    expense_type VARCHAR(50) NOT NULL DEFAULT 'Other',
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_by UUID
);

CREATE INDEX IX_expense_categories_parent_id ON expense_categories(parent_id);

-- Add category_id to expenses
ALTER TABLE expenses ADD COLUMN category_id UUID REFERENCES expense_categories(id);

-- Seed default categories
INSERT INTO expense_categories (name, code, expense_type, created_at, updated_at) VALUES
('Rent', 'RENT', 'Operational', NOW(), NOW()),
('Electricity', 'ELECTRICITY', 'Operational', NOW(), NOW()),
('Water', 'WATER', 'Operational', NOW(), NOW()),
('Internet', 'INTERNET', 'Operational', NOW(), NOW()),
('Office Supplies', 'OFFICE', 'Administrative', NOW(), NOW()),
('Salaries', 'SALARIES', 'HR', NOW(), NOW()),
('Marketing', 'MARKETING', 'Marketing', NOW(), NOW()),
('Travel', 'TRAVEL', 'Operational', NOW(), NOW()),
('Maintenance', 'MAINTENANCE', 'Operational', NOW(), NOW()),
('Insurance', 'INSURANCE', 'Administrative', NOW(), NOW()),
('Legal', 'LEGAL', 'Administrative', NOW(), NOW()),
('Software', 'SOFTWARE', 'Administrative', NOW(), NOW()),
('Bank Charges', 'BANK_CHARGES', 'Administrative', NOW(), NOW()),
('Taxes', 'TAXES', 'Tax', NOW(), NOW()),
('Other', 'OTHER', 'Other', NOW(), NOW());

-- Migrate existing expenses
UPDATE expenses e SET category_id = (
    SELECT id FROM expense_categories 
    WHERE UPPER(name) = UPPER(e.category) 
    LIMIT 1
);

-- Make category NOT NULL after migration
ALTER TABLE expenses ALTER COLUMN category_id SET NOT NULL;
```

---

### 8.2 Phase 2: HR Enhancement (Week 3-4)

#### 8.2.1 Add Salary Components

```sql
-- Create salary_components table
CREATE TABLE salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    component_type VARCHAR(50) NOT NULL,
    calculation_type VARCHAR(50) NOT NULL DEFAULT 'Fixed',
    value DECIMAL(18,4) NOT NULL DEFAULT 0,
    is_taxable BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IX_salary_components_code ON salary_components(code) UNIQUE;

-- Create employee_salary_components table
CREATE TABLE employee_salary_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES salary_components(id) ON DELETE CASCADE,
    custom_value DECIMAL(18,4),
    is_active BOOLEAN NOT NULL DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IX_emp_salary_comp_employee ON employee_salary_components(employee_id);

-- Seed default components
INSERT INTO salary_components (name, code, component_type, calculation_type, value, is_taxable) VALUES
('House Rent Allowance', 'HRA', 'Allowance', 'Percentage', 40, true),
('Transport Allowance', 'TA', 'Allowance', 'Fixed', 0, true),
('Medical Allowance', 'MA', 'Allowance', 'Fixed', 0, true),
('Dearness Allowance', 'DA', 'Allowance', 'Percentage', 10, true),
('Provident Fund', 'PF', 'Deduction', 'Percentage', 12, false),
('Employee State Insurance', 'ESI', 'Deduction', 'Percentage', 0.75, false),
('Professional Tax', 'PT', 'Deduction', 'Fixed', 0, false);
```

#### 8.2.2 Add Leave Policies

```sql
-- Create leave_policies table
CREATE TABLE leave_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    leave_type VARCHAR(50) NOT NULL,
    paid_leave BOOLEAN NOT NULL DEFAULT true,
    max_days_per_year INT,
    max_consecutive_days INT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IX_leave_policies_code ON leave_policies(code) UNIQUE;

-- Create employee_leave_balances table
CREATE TABLE employee_leave_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    leave_policy_id UUID NOT NULL REFERENCES leave_policies(id) ON DELETE CASCADE,
    year INT NOT NULL,
    total_days DECIMAL(5,2) NOT NULL,
    used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    pending_days DECIMAL(5,2) NOT NULL DEFAULT 0,
    last_reset_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(employee_id, leave_policy_id, year)
);

CREATE INDEX IX_emp_leave_balance ON employee_leave_balances(employee_id, year);

-- Seed default policies
INSERT INTO leave_policies (name, code, leave_type, paid_leave, max_days_per_year, max_consecutive_days) VALUES
('Annual Leave', 'ANNUAL', 'Annual', true, 18, 15),
('Sick Leave', 'SICK', 'Sick', true, 12, 7),
('Casual Leave', 'CASUAL', 'Casual', true, 6, 3),
('Maternity Leave', 'MATERNITY', 'Maternity', true, 90, 90),
('Paternity Leave', 'PATERNITY', 'Paternity', true, 15, 15),
('Loss of Pay', 'LOP', 'Unpaid', false, NULL, NULL),
('Compensatory Off', 'COMPOFF', 'CompOff', true, NULL, 2);

-- Initialize balances for existing employees
INSERT INTO employee_leave_balances (employee_id, leave_policy_id, year, total_days, used_days, pending_days)
SELECT e.id, lp.id, 2026, lp.max_days_per_year, 0, 0
FROM employees e
CROSS JOIN leave_policies lp
WHERE e.status = 'Active' AND lp.is_active = true AND lp.max_days_per_year IS NOT NULL;
```

---

### 8.3 Phase 3: Vendor Separation (Week 5)

```sql
-- Create vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    business_name VARCHAR(255),
    contact_person VARCHAR(200),
    email VARCHAR(255),
    phone VARCHAR(50),
    alt_phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    pan_number VARCHAR(50),
    gst_number VARCHAR(50),
    payment_terms VARCHAR(50),
    credit_limit DECIMAL(18,4),
    opening_balance DECIMAL(18,4) NOT NULL DEFAULT 0,
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_by UUID
);

CREATE UNIQUE INDEX UX_vendors_email ON vendors(email) WHERE email IS NOT NULL;
CREATE INDEX IX_vendors_name ON vendors(name);

-- Migrate suppliers from contacts
INSERT INTO vendors (name, business_name, email, phone, address, pan_number, opening_balance, created_at, updated_at)
SELECT name, business_name, email, phone, address, pan_number, opening_balance, created_at, updated_at
FROM contacts
WHERE contact_type = 'Supplier';

-- Add vendor_id to purchase_orders
ALTER TABLE purchase_orders ADD COLUMN vendor_id UUID REFERENCES vendors(id);

-- Update existing purchase_orders
UPDATE purchase_orders po SET vendor_id = v.id
FROM vendors v
WHERE po.supplier_id = v.id;

-- Make vendor_id NOT NULL
ALTER TABLE purchase_orders ALTER COLUMN vendor_id SET NOT NULL;

-- Drop old supplier_id column (after migration)
-- ALTER TABLE purchase_orders DROP COLUMN supplier_id;
```

---

### 8.4 Phase 4: Platform Billing (Week 6-7)

```sql
-- Create client_documents table
CREATE TABLE client_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by UUID,
    verified_at TIMESTAMPTZ,
    verified_by UUID,
    verification_status VARCHAR(50) DEFAULT 'Pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IX_client_documents_client_id ON client_documents(client_id);

-- Create platform_invoices table
CREATE TABLE platform_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_number VARCHAR(50) NOT NULL UNIQUE,
    client_id UUID NOT NULL REFERENCES clients(id),
    subscription_id UUID REFERENCES client_subscriptions(id),
    invoice_type VARCHAR(50) NOT NULL,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'NPR',
    status VARCHAR(50) NOT NULL DEFAULT 'Draft',
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    paid_at TIMESTAMPTZ,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(255),
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IX_platform_invoices_client_id ON platform_invoices(client_id);
CREATE INDEX IX_platform_invoices_status ON platform_invoices(status);

-- Create platform_payments table
CREATE TABLE platform_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES platform_invoices(id),
    client_id UUID NOT NULL REFERENCES clients(id),
    amount DECIMAL(18,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255),
    transaction_id VARCHAR(255),
    paid_at TIMESTAMPTZ NOT NULL,
    received_by UUID,
    bank_name VARCHAR(100),
    bank_receipt_number VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IX_platform_payments_client_id ON platform_payments(client_id);
```

---

## 9. Implementation Guidelines

### 9.1 Code Generation

#### 9.1.1 Entity Classes

```csharp
// Example: Batch entity
public class Batch : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string BatchNumber { get; set; } = string.Empty;
    public DateTime? ManufacturingDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public decimal? CostPrice { get; set; }
    public bool IsActive { get; set; } = true;
}

// Example: Inventory entity
public class Inventory : BaseEntity
{
    public Guid ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public Guid WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;
    public Guid? BatchId { get; set; }
    public Batch? Batch { get; set; }
    public int Quantity { get; set; }
    public int ReservedQuantity { get; set; }
    public int AvailableQuantity => Quantity - ReservedQuantity;
    public int ReorderPoint { get; set; }
}
```

#### 9.1.2 DbContext Configuration

```csharp
// Inventory relationships
builder.Entity<Inventory>()
    .HasOne(i => i.Product)
    .WithMany(p => p.InventoryItems)
    .HasForeignKey(i => i.ProductId)
    .OnDelete(DeleteBehavior.Cascade);

builder.Entity<Inventory>()
    .HasOne(i => i.Warehouse)
    .WithMany()
    .HasForeignKey(i => i.WarehouseId)
    .OnDelete(DeleteBehavior.Cascade);

builder.Entity<Inventory>()
    .HasOne(i => i.Batch)
    .WithMany()
    .HasForeignKey(i => i.BatchId)
    .OnDelete(DeleteBehavior.SetNull);

builder.Entity<Inventory>()
    .HasIndex(i => new { i.ProductId, i.WarehouseId, i.BatchId })
    .IsUnique();

// Inventory movement relationships
builder.Entity<InventoryMovement>()
    .HasOne(m => m.Inventory)
    .WithMany()
    .HasForeignKey(m => m.InventoryId)
    .OnDelete(DeleteBehavior.Cascade);
```

### 9.2 Service Layer

#### 9.2.1 Inventory Service

```csharp
public interface IInventoryService
{
    Task<InventoryDto> GetStockAsync(Guid productId, Guid warehouseId, Guid? batchId = null);
    Task<IEnumerable<InventoryDto>> GetLowStockItemsAsync();
    Task<IEnumerable<InventoryDto>> GetExpiringStockAsync(int daysAhead);
    Task<InventoryMovementDto> RecordMovementAsync(RecordMovementRequest request);
    Task TransferStockAsync(TransferStockRequest request);
}

public class InventoryService : IInventoryService
{
    private readonly AppDbContext _context;
    private readonly ICurrentUserService _user;

    public async Task<InventoryMovementDto> RecordMovementAsync(RecordMovementRequest request)
    {
        // Get or create inventory record
        var inventory = await GetOrCreateInventoryAsync(
            request.ProductId,
            request.WarehouseId,
            request.BatchId);

        // Calculate new quantity
        var quantityChange = request.MovementType switch
        {
            MovementType.Purchase => request.Quantity,
            MovementType.Sale => -request.Quantity,
            MovementType.Return => request.Quantity,
            MovementType.Adjustment => request.Quantity > 0 ? request.Quantity : -Math.Abs(request.Quantity),
            MovementType.Damage => -request.Quantity,
            _ => 0
        };

        var newQuantity = inventory.Quantity + quantityChange;
        if (newQuantity < 0)
            throw new InsufficientStockException(request.ProductId);

        // Update inventory
        inventory.Quantity = newQuantity;
        inventory.UpdatedAt = DateTime.UtcNow;

        // Create movement record
        var movement = new InventoryMovement
        {
            InventoryId = inventory.Id,
            ProductId = request.ProductId,
            WarehouseId = request.WarehouseId,
            BatchId = request.BatchId,
            MovementType = request.MovementType,
            Quantity = quantityChange,
            BalanceAfter = newQuantity,
            ReferenceType = request.ReferenceType,
            ReferenceId = request.ReferenceId,
            ReferenceNumber = request.ReferenceNumber,
            Notes = request.Notes,
            MovedAt = DateTime.UtcNow,
            CreatedBy = _user.GetUserId()
        };

        _context.InventoryMovements.Add(movement);
        await _context.SaveChangesAsync();

        return MapToDto(movement);
    }
}
```

### 9.3 FEFO Implementation

```csharp
public class FEFOService
{
    public async Task<IEnumerable<InventoryAllocation>> AllocateForSale(
        Guid productId,
        Guid warehouseId,
        int quantity)
    {
        // Get inventory items sorted by expiry (FEFO)
        var items = await _context.Inventory
            .Where(i => i.ProductId == productId
                     && i.WarehouseId == warehouseId
                     && i.Quantity > 0)
            .Join(_context.Batches.Where(b => b.IsActive),
                  inv => inv.BatchId,
                  batch => batch.Id,
                  (inv, batch) => new { Inventory = inv, Batch = batch })
            .OrderBy(x => x.Batch.ExpiryDate ?? DateTime.MaxValue)
            .ThenBy(x => x.Inventory.CreatedAt)
            .ToListAsync();

        var allocations = new List<InventoryAllocation>();
        var remaining = quantity;

        foreach (var item in items)
        {
            if (remaining <= 0) break;

            var allocate = Math.Min(item.Inventory.AvailableQuantity, remaining);
            allocations.Add(new InventoryAllocation
            {
                InventoryId = item.Inventory.Id,
                BatchId = item.Batch.Id,
                Quantity = allocate,
                ExpiryDate = item.Batch.ExpiryDate
            });

            remaining -= allocate;
        }

        if (remaining > 0)
            throw new InsufficientStockException(productId, quantity - remaining);

        return allocations;
    }
}
```

### 9.4 Data Seeding

```csharp
public static class DataSeeder
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Subscription Plans
        if (!context.SubscriptionPlans.Any())
        {
            var plans = new[]
            {
                new SubscriptionPlan
                {
                    Name = "Basic",
                    Code = "basic",
                    MonthlyPrice = 4999,
                    AnnualPrice = 49990,
                    MaxUsers = 3,
                    MaxProducts = 100,
                    MaxInvoices = 50,
                    MaxWarehouses = 1,
                    AllowPOS = true,
                    AllowInventory = true,
                    AllowInvoices = true,
                    AllowHR = false,
                    AllowProjects = false,
                    AllowReports = false,
                    AllowBatchTracking = false,
                    AllowMultiWarehouse = false,
                    IsDefault = true,
                    SortOrder = 1
                },
                new SubscriptionPlan
                {
                    Name = "Professional",
                    Code = "professional",
                    MonthlyPrice = 14999,
                    AnnualPrice = 149990,
                    MaxUsers = 10,
                    MaxProducts = 1000,
                    MaxInvoices = 500,
                    MaxWarehouses = 3,
                    AllowPOS = true,
                    AllowInventory = true,
                    AllowInvoices = true,
                    AllowHR = true,
                    AllowProjects = true,
                    AllowReports = true,
                    AllowBatchTracking = true,
                    AllowMultiWarehouse = true,
                    SortOrder = 2
                },
                new SubscriptionPlan
                {
                    Name = "Enterprise",
                    Code = "enterprise",
                    MonthlyPrice = 49999,
                    AnnualPrice = 499990,
                    MaxUsers = 100,
                    MaxProducts = 10000,
                    MaxInvoices = 5000,
                    MaxWarehouses = 20,
                    AllowPOS = true,
                    AllowInventory = true,
                    AllowInvoices = true,
                    AllowHR = true,
                    AllowProjects = true,
                    AllowReports = true,
                    AllowBatchTracking = true,
                    AllowMultiWarehouse = true,
                    AllowAPI = true,
                    AllowMultipleBranches = true,
                    SortOrder = 3
                }
            };
            context.SubscriptionPlans.AddRange(plans);
        }

        // Modules
        if (!context.Modules.Any())
        {
            var modules = new[]
            {
                new Module { Name = "Dashboard", Code = "dashboard", Icon = "dashboard", SortOrder = 1, IsCore = true },
                new Module { Name = "POS", Code = "pos", Icon = "point_of_sale", SortOrder = 2 },
                new Module { Name = "Invoices", Code = "invoices", Icon = "receipt", SortOrder = 3, IsCore = true },
                new Module { Name = "Inventory", Code = "inventory", Icon = "inventory", SortOrder = 4 },
                new Module { Name = "Purchase", Code = "purchase", Icon = "shopping_cart", SortOrder = 5 },
                new Module { Name = "Expenses", Code = "expenses", Icon = "account_balance_wallet", SortOrder = 6 },
                new Module { Name = "Khata", Code = "khata", Icon = "menu_book", SortOrder = 7 },
                new Module { Name = "HR", Code = "hr", Icon = "people", SortOrder = 8 },
                new Module { Name = "Projects", Code = "projects", Icon = "assignment", SortOrder = 9 },
                new Module { Name = "Reports", Code = "reports", Icon = "analytics", SortOrder = 10 },
                new Module { Name = "Settings", Code = "settings", Icon = "settings", SortOrder = 99, IsCore = true }
            };
            context.Modules.AddRange(modules);
        }

        await context.SaveChangesAsync();
    }
}
```

---

## 10. Appendix

### 10.1 Glossary

| Term | Definition |
|------|------------|
| Tenant | A client business using the platform |
| Client | Same as Tenant |
| Master Schema | Platform-level tables (plans, clients, etc.) |
| Tenant Schema | Client-level business data |
| FEFO | First Expiry First Out (inventory allocation) |
| SKU | Stock Keeping Unit |
| POS | Point of Sale |
| HSN | Harmonized System of Nomenclature |
| PAN | Permanent Account Number (tax ID) |
| VAT | Value Added Tax |
| TDS | Tax Deducted at Source |
| PF | Provident Fund |
| ESI | Employee State Insurance |

### 10.2 ERD Summary

```
Master Schema Relationships:

clients ──────────────< client_subscriptions >────────────── subscription_plans
   │                                                      (FK: plan_id)
   │ (FK: owner_user_id)
   │
   ├──────────────< client_documents
   │
   ├──────────────< client_modules >─────────────── modules
   │
   └──────────────< platform_invoices >────────────< platform_payments


Tenant Schema Relationships:

branches ─────────────< users ───────────────< user_branch_access
                          │
                          └───────────────────< employees
                                                    │
                                                    ├──────────────< attendance
                                                    ├──────────────< leave_requests
                                                    ├──────────────< payroll
                                                    │
                                                    └──────────────< employee_salary_components >─── salary_components

categories ──────────< products ──────────────< product_variants
   │                       │
   │                       ├──────────────< inventory >────────── batches
   │                       │                    │
   │                       │                    └──────────────< inventory_movements
   │                       │
   │                       ├──────────────< purchase_order_items >─── purchase_orders >─── vendors
   │                       │
   │                       └──────────────< invoice_items >─── invoices >─── contacts
   │                                                       │
   │                                                       └──────────────< invoice_payments
   │
   ├──────────────< warehouses ──────────────< warehouse_transfers
   │                      
   └──────────────< expenses >─── expense_categories

contacts ─────────────< khata_entries
   │
   ├──────────────< invoices
   │
   └──────────────< projects >───────────────< project_tasks >─── timesheets >─── employees
```

### 10.3 Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-04-16 | Sisyphus | Initial specification |

---

**Document Status:** Draft - Pending Review  
**Next Review:** After Phase 1 migration completion
