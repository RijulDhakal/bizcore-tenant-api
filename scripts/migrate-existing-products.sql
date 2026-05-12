-- Seed WarehouseStock for existing products
-- Run this script once to migrate existing products to have WarehouseStock records

INSERT INTO "WarehouseStock" ("Id", "TenantId", "WarehouseId", "ProductId", "CurrentStock", "ReservedStock", "CreatedAt", "UpdatedAt", "IsDeleted")
SELECT
    gen_random_uuid(),
    p."TenantId",
    (SELECT "Id" FROM "Warehouses" w WHERE w."TenantId" = p."TenantId" AND w."IsDefault" = true LIMIT 1),
    p."Id",
    COALESCE((
        SELECT SUM("Quantity")
        FROM "StockMovements"
        WHERE "ProductId" = p."Id" AND "ReferenceType" = 'OpeningStock'
    ), 0),
    0,
    NOW(),
    NOW(),
    false
FROM "Products" p
WHERE p."IsDeleted" = false
AND NOT EXISTS (
    SELECT 1 FROM "WarehouseStock" ws WHERE ws."ProductId" = p."Id"
);
