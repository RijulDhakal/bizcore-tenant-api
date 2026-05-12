# BizCore - Multi-Tenant Business Management Platform

## Project Overview

**BizCore** is a comprehensive multi-tenant ERP (Enterprise Resource Planning) platform designed for SMEs (Small and Medium Enterprises). The platform provides complete business management capabilities including accounting, inventory, POS, HR, and project management with full multi-tenant isolation and role-based access control.

**Target Market:** Nepal/South Asia (NPR currency, Nepali fiscal year "Shrawan", PAN/VAT tax compliance)

---

## Architecture

### Solution Structure (Clean Architecture)

```
BizCore/
├── BizCore.API/              # ASP.NET Core Web API
├── BizCore.Application/      # Application services, DTOs, interfaces
├── BizCore.Domain/           # Core entities, enums, domain models
├── BizCore.Infrastructure/   # EF Core DbContext, repositories, services
├── BizCore.Shared/           # Constants, wrappers, extensions
└── bizcore-web/              # React 19 SPA frontend
```

### Technology Stack

#### Backend
- **.NET 8** (ASP.NET Core Web API)
- **Entity Framework Core 8** with PostgreSQL (Npgsql)
- **ASP.NET Core Identity** for authentication
- **JWT Bearer** authentication with refresh tokens
- **FluentValidation** for request validation
- **AspNetCoreRateLimit** for rate limiting
- **QuestPDF** for document generation
- **BCrypt.Net** for password hashing

#### Frontend
- **React 19** with TypeScript 5
- **Vite 8** for build tooling
- **React Router 7** for routing
- **TanStack Query 5** for server state
- **Zustand** for client state management
- **Tailwind CSS 3** for styling
- **Radix UI** for accessible components
- **React Hook Form + Zod** for forms
- **Recharts** for analytics/charts
- **Lucide React** for icons
- **Sonner** for notifications

---

## Domain Model

### Entity Hierarchy

```
BaseEntity (abstract)
├── Id: Guid
├── CreatedAt: DateTime
├── UpdatedAt: DateTime
└── IsDeleted: bool

TenantEntity : BaseEntity
└── TenantId: Guid (all business data)

Business : BaseEntity (creates tenants, not tenant-scoped)
├── TenantId: Guid (unique)
├── Name, BusinessType, Email, Address, Phone
├── PANNumber, VATNumber, IsVATRegistered
├── Currency (default "NPR")
└── FiscalYearStart (default "Shrawan")
```

### Key Enums

| Enum | Values |
|------|--------|
| UserRole | SuperAdmin(0), Admin(1), Accountant(2), Sales(3), POSOperator(4), Owner(5), HRManager(6) |
| InvoiceStatus | Draft, Sent, Paid, Overdue |
| InvoiceType | Retail(0), Merchant(1), Delivery(2) |
| StockMovementType | StockIn, StockOut, Adjustment, Transfer |
| POSSessionStatus | Open, Closed |
| PaymentMethod | Cash, Card, QR, Credit |
| EmploymentType | FullTime, PartTime, Contract |
| EmployeeStatus | Active, OnLeave, Terminated |
| LeaveType | Annual, Sick, Maternity, Paternity, Unpaid, Other |
| LeaveStatus | Pending, Approved, Rejected, Cancelled |
| ProjectStatus | Planning, Active, OnHold, Completed, Cancelled |

---

## Functional Modules

### 1. Authentication & Authorization
- JWT access + refresh token authentication
- Role-based access control (7 roles)
- Login history tracking
- Password change flow
- First login detection

### 2. Multi-Tenancy
- Tenant middleware for context resolution
- Global query filters for data isolation
- Tenant-scoped modules and permissions
- Business registration and user assignment

### 3. CRM & Sales
- **Contacts:** Customer/supplier management with PAN, address, phone
- **Invoices:** Tax invoices with line items, payment terms, VAT compliance
- **Merchants:** Commission-based merchant partners
- **Delivery Partners:** Delivery fee management with orders

### 4. Point of Sale (POS)
- POS sessions with opening/closing cash
- Transaction processing with multiple payment methods
- Customer assignment
- Discount handling
- Real-time inventory updates

### 5. Inventory Management
- Products with SKU, barcode, HSN code
- Categories and warehouse organization
- Stock movements (in/out/adjustment/transfer)
- Low stock alerts with thresholds
- Expiry tracking

### 6. Purchase Management
- Purchase orders with line items
- Supplier management
- Order status tracking (Draft, Sent, Received, Cancelled)
- Stock auto-update on receipt

### 7. HR & Payroll
- Employee records with salary components
- Attendance tracking (check-in/out, working hours)
- Leave management (request/approval workflow)
- Payroll processing with allowances and deductions
- PF/SSF/TDS calculations
- HR assistance requests

### 8. Project Management
- Projects with client and manager assignment
- Tasks with status, priority, assignee
- Timesheet logging
- Budget tracking

### 9. Accounting
- **Expenses:** Categorized expense tracking
- **Bank Accounts:** Account reconciliation
- **Bank Transactions:** Transaction categorization
- **Khata:** Digital ledger for credit tracking
- **VAT Reports:** Tax reporting compliance

### 10. Reports & Analytics
- Business KPIs and metrics
- Revenue analytics
- Growth tracking
- DAU metrics
- Feature usage analytics
- Geography insights

### 11. SuperAdmin Platform
- Tenant directory management
- User management across tenants
- Password reset capabilities
- User login history
- Business status control (active/suspended)
- Revenue overview
- System information
- Platform settings
- Audit logging

---

## API Endpoints (25 Controllers)

| Controller | Route | Purpose |
|------------|-------|---------|
| AuthController | /api/auth | Login, Register, Refresh, Logout |
| BootstrapController | /api/bootstrap | Initial app data loading |
| BusinessController | /api/business | Business CRUD |
| ContactsController | /api/contacts | Contact management |
| InvoicesController | /api/invoices | Invoice operations |
| InventoryController | /api/inventory | Products, Categories, Stock |
| POSController | /api/pos | POS sessions, transactions |
| PurchaseController | /api/purchase | Purchase orders |
| ExpenseController | /api/expenses | Expense tracking |
| HRController | /api/hr | Employee, Attendance, Payroll |
| ProjectsController | /api/projects | Project management |
| ReportsController | /api/reports | Reporting |
| BankingController | /api/banking | Bank accounts, transactions |
| KhataController | /api/khata | Khata ledger |
| ModulesController | /api/modules | Module management |
| PermissionsController | /api/permissions | Permission management |
| SuperAdminController | /api/superadmin | Platform admin |
| AdminController | /api/admin | Business admin |
| SelfServiceController | /api/selfservice | User self-service |
| DashboardController | /api/dashboard | Business metrics |
| DamagedGoodsController | /api/damaged-goods | Damage tracking |
| DeliveryPartnersController | /api/delivery-partners | Delivery management |
| DemandForecastController | /api/demand-forecast | Forecasting |
| FeatureFlagsController | /api/feature-flags | Feature toggles |
| MerchantsController | /api/merchants | Merchant management |

---

## Frontend Structure

### Pages (29)

**Business User Pages:**
- Dashboard.tsx
- Contacts.tsx, Invoices.tsx, Inventory.tsx
- POS.tsx, POSTerminal.tsx
- Purchase.tsx, Expenses.tsx
- HR.tsx, MyAttendance.tsx, MyLeaves.tsx, MyPayslips.tsx, HRAssistance.tsx
- Projects.tsx, ProjectDetail.tsx
- Khata.tsx, CashBook.tsx, Reports.tsx, VatReport.tsx
- Settings.tsx, ChangePassword.tsx

**SuperAdmin Pages (superadmin/):**
- Dashboard.tsx, Businesses.tsx, BusinessDetail.tsx
- UsersList.tsx, Revenue.tsx, Analytics.tsx
- System.tsx, SuperAdminSettings.tsx

**Auth Pages:**
- Login.tsx, Register.tsx

### State Management

```typescript
// Auth Store (Zustand + Persist)
- user: User | null
- business: Business | null
- modules: ModuleInfo[]
- accessToken, refreshToken
- Role helpers: isSuperAdmin(), isAdmin(), isOwner(), etc.

// Permission Store
- Role-based permission checks
- Module enablement tracking

// Theme Store
- UI theme preferences
```

---

## Data Isolation Strategy

### Tenant Resolution Flow
1. JWT token contains `tid` (tenant ID) claim
2. `ITenantService` extracts tenant from token
3. Middleware validates tenant context
4. Global query filters automatically apply `TenantId` filter

### Query Filter Pattern
```csharp
// All TenantEntity types automatically filtered
builder.Entity<Invoice>()
    .HasQueryFilter(e => !e.IsDeleted && e.TenantId == _tenantService.GetTenantId());

// SuperAdmin data has no tenant filter
builder.Entity<Business>().HasQueryFilter(e => !e.IsDeleted);
```

---

## Build & Deployment

### Frontend
```bash
cd bizcore-web
npm run dev      # Development
npm run build    # Production build
npm run preview  # Preview build
```

### Backend
```bash
dotnet build     # Build solution
dotnet run       # Run API (from BizCore.API)
```

---

## Security Features

- JWT access tokens with issuer/audience validation
- Refresh token rotation
- Role-based route protection
- SuperAdmin isolation (dedicated route prefix)
- IP rate limiting (non-dev environments)
- Secure password policy via Identity
- Login history tracking
- SuperAdmin audit logging
- Soft-delete strategy for data recovery

---

## Development Phases (Inferred)

| Phase | Modules |
|-------|---------|
| Phase 1 | Auth, Business, Contacts, Khata, Party |
| Phase 2 | Inventory, POS, Purchase |
| Phase 3 | HR, Projects, Expenses, Banking, Reports |

---

## Key Files Reference

### Backend Entry Points
- `BizCore.API/Program.cs` - API configuration, DI setup
- `BizCore.Infrastructure/Data/AppDbContext.cs` - EF Core context
- `BizCore.Application/Interfaces/` - Service interfaces

### Frontend Entry Points
- `bizcore-web/src/App.tsx` - Root component
- `bizcore-web/src/pages/` - Route pages
- `bizcore-web/src/store/` - Zustand stores

---

## Next Steps for Development

1. **Complete HR Module** - Payroll processing, attendance reports
2. **Reports Module** - Financial reports, tax reports, analytics
3. **Real-time Features** - WebSocket notifications
4. **Email/SMS Integration** - Notifications, OTPs
5. **Export Features** - Excel, PDF exports
6. **Advanced Analytics** - Dashboard customization
7. **Mobile App** - React Native wrapper or PWA
8. **API Documentation** - OpenAPI improvements
9. **Testing** - Unit tests, integration tests
10. **CI/CD Pipeline** - Automated builds and deployments
