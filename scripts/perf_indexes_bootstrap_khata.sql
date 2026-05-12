-- Bootstrap + Khata performance indexes
-- Run against PostgreSQL database (safe to re-run).

CREATE INDEX IF NOT EXISTS "IX_Businesses_TenantId_IsDeleted_CreatedAt"
ON "Businesses" ("TenantId", "IsDeleted", "CreatedAt");

CREATE INDEX IF NOT EXISTS "IX_AspNetUsers_Id_IsDeleted"
ON "AspNetUsers" ("Id", "IsDeleted");

CREATE INDEX IF NOT EXISTS "IX_Parties_TenantId_IsDeleted_Name"
ON "Parties" ("TenantId", "IsDeleted", "Name");

CREATE INDEX IF NOT EXISTS "IX_KhataEntries_TenantId_PartyId_IsDeleted_Date_CreatedAt"
ON "KhataEntries" ("TenantId", "PartyId", "IsDeleted", "Date", "CreatedAt");

CREATE INDEX IF NOT EXISTS "IX_KhataEntries_TenantId_PartyId_Type_Amount_CreatedAt"
ON "KhataEntries" ("TenantId", "PartyId", "Type", "Amount", "CreatedAt");
