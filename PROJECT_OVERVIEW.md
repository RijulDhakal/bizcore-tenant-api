# BizCore Project Overview

## Project Summary
BizCore is a multi-tenant business management and ERP-style platform designed for SMEs. It includes day-to-day business operations, accounting workflows, inventory, POS, HR, projects, reporting, and a platform-level SuperAdmin console.

## Architecture
- Backend architecture: Clean Architecture style with layered projects.
- Multi-tenant model: Tenant-aware requests and tenant-level data boundaries.
- Frontend architecture: React SPA with route-based modules and role-based navigation.
- Authentication model: JWT-based auth with role claims and protected routes.
- Data model: EF Core with PostgreSQL, soft-delete strategy in multiple entities.

## Solution Structure
- BizCore.API: ASP.NET Core Web API entrypoint, controllers, middleware, pipeline config.
- BizCore.Application: Application services, DTOs, interfaces, validators.
- BizCore.Domain: Core entities, enums, domain models.
- BizCore.Infrastructure: EF Core DbContext, repositories, service implementations, migrations.
- BizCore.Shared: Shared constants, wrappers, extensions.
- bizcore-web: React frontend application.

## Core Technology Stack

### Backend
- .NET 8 (ASP.NET Core Web API)
- Entity Framework Core 8
- PostgreSQL (Npgsql provider)
- ASP.NET Core Identity
- JWT Bearer authentication
- Swagger / OpenAPI (Swashbuckle)
- FluentValidation
- AspNetCoreRateLimit
- BCrypt.Net-Next (password hasher integration)
- QuestPDF (document/PDF generation support)

### Frontend
- React 19
- TypeScript 5
- Vite 8
- React Router 7
- TanStack Query 5
- Zustand (state management)
- Axios
- Tailwind CSS 3
- Radix UI primitives
- React Hook Form + Zod
- Recharts (analytics/charting)
- Lucide icons
- Sonner / toast notifications

## Security and Platform Controls
- JWT access tokens with issuer and audience validation.
- Role-based access model.
- SuperAdmin role isolation and dedicated route protection.
- Tenant middleware for tenant context resolution.
- Exception middleware for centralized API error handling.
- IP rate limiting support for non-development environments.
- Secure password policy via Identity options.

## Primary Roles
- SuperAdmin
- Admin
- Manager
- Cashier
- Staff
- Owner

## Business-Side Functional Modules
- Dashboard with KPI-style business metrics.
- Digital Khata ledger workflows.
- Contacts and customer management.
- Invoice management.
- Expense tracking.
- Inventory management.
- Purchase management.
- POS and POS terminal workflows.
- HR and payroll module.
- Project management and project detail tracking.
- Cash book module.
- VAT report module.
- Reports module.
- Business settings module.

## SuperAdmin Functional Modules
- Platform dashboard.
- Tenant directory (business listing and detail view).
- Business status control (active or suspended).
- User management with filters, paging, role/status updates.
- User business reassignment.
- Password reset for users.
- User login history viewing.
- User deletion flow.
- Revenue overview across platform and tenants.
- Analytics dashboards (overview, growth, DAU, feature usage, geography).
- System information page.
- Platform settings page.

## Key Backend API Domains
- Auth
- Business
- Contacts
- Invoices
- Expense
- Inventory
- Purchase
- POS
- HR
- Projects
- Reports
- Banking
- Khata
- Admin
- SuperAdmin

## Data and Operational Features
- Auto migration on API startup.
- Multi-tenant data correction step on startup for selected records.
- Login history capture for security/audit visibility.
- SuperAdmin audit logging support.
- Soft-delete behavior and filtered retrieval patterns.

## Frontend Platform Features
- Route guards for authenticated users and role-specific access.
- Separate business-user and superadmin navigation flows.
- Query caching and API state management with TanStack Query.
- Modern UI components with reusable design primitives.
- Toast-based user feedback for actions and errors.

## Build and Run

### Frontend
- Development: npm run dev
- Build: npm run build
- Preview: npm run preview

### Backend
- Run API: dotnet run (from BizCore.API)
- Solution build: dotnet build (from workspace root)

## Notes
- Frontend and backend are developed as separate deployable applications.
- The platform is structured to scale module-by-module while preserving tenant boundaries.
