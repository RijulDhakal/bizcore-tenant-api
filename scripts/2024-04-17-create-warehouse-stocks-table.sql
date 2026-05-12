-- Create WarehouseStocks table for per-product per-warehouse stock tracking

CREATE TABLE IF NOT EXISTS "WarehouseStocks" (
    "Id" uuid NOT NULL DEFAULT gen_random_uuid(),
    "WarehouseId" uuid NOT NULL,
    "ProductId" uuid NOT NULL,
    "BatchId" uuid NULL,
    "CurrentStock" integer NOT NULL DEFAULT 0,
    "ReservedStock" integer NOT NULL DEFAULT 0,
    "TenantId" uuid NOT NULL,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "IsDeleted" boolean NOT NULL DEFAULT FALSE,
    CONSTRAINT "PK_WarehouseStocks" PRIMARY KEY ("Id"),
    CONSTRAINT "FK_WarehouseStocks_Products_ProductId" FOREIGN KEY ("ProductId") REFERENCES "Products" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_WarehouseStocks_Warehouses_WarehouseId" FOREIGN KEY ("WarehouseId") REFERENCES "Warehouses" ("Id") ON DELETE RESTRICT,
    CONSTRAINT "FK_WarehouseStocks_Batches_BatchId" FOREIGN KEY ("BatchId") REFERENCES "Batches" ("Id") ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS "IX_WarehouseStocks_ProductId" ON "WarehouseStocks" ("ProductId");
CREATE INDEX IF NOT EXISTS "IX_WarehouseStocks_WarehouseId" ON "WarehouseStocks" ("WarehouseId");
CREATE INDEX IF NOT EXISTS "IX_WarehouseStocks_TenantId" ON "WarehouseStocks" ("TenantId");
CREATE INDEX IF NOT EXISTS "IX_WarehouseStocks_BatchId" ON "WarehouseStocks" ("BatchId");
CREATE UNIQUE INDEX IF NOT EXISTS "IX_WarehouseStocks_WarehouseId_ProductId_TenantId"
    ON "WarehouseStocks" ("WarehouseId", "ProductId", "TenantId")
    WHERE "IsDeleted" = FALSE;
