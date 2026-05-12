-- Phase 2: Purchase Enhancement - Goods Receipt & Returns

ALTER TABLE "PurchaseOrderItems" ADD COLUMN IF NOT EXISTS "QuantityReceived" integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "GoodsReceipts" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" uuid NOT NULL,
    "PurchaseOrderId" uuid NOT NULL,
    "ReceiptNumber" varchar(50) NOT NULL,
    "ReceivedDate" timestamp with time zone NOT NULL,
    "Notes" text,
    "Status" integer NOT NULL DEFAULT 0,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "IsDeleted" boolean NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_GoodsReceipts_PurchaseOrders" FOREIGN KEY ("PurchaseOrderId") 
        REFERENCES "PurchaseOrders"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "GoodsReceiptItems" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "GoodsReceiptId" uuid NOT NULL,
    "PurchaseOrderItemId" uuid NOT NULL,
    "ProductId" uuid NOT NULL,
    "QuantityReceived" integer NOT NULL,
    "Notes" text,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "IsDeleted" boolean NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_GoodsReceiptItems_GoodsReceipts" FOREIGN KEY ("GoodsReceiptId") 
        REFERENCES "GoodsReceipts"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_GoodsReceiptItems_PurchaseOrderItems" FOREIGN KEY ("PurchaseOrderItemId") 
        REFERENCES "PurchaseOrderItems"("Id") ON DELETE CASCADE,
    CONSTRAINT "FK_GoodsReceiptItems_Products" FOREIGN KEY ("ProductId") 
        REFERENCES "Products"("Id") ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS "PurchaseReturns" (
    "Id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "TenantId" uuid NOT NULL,
    "PurchaseOrderId" uuid NOT NULL,
    "ReturnNumber" varchar(50) NOT NULL,
    "ReturnDate" timestamp with time zone NOT NULL,
    "Reason" varchar(500) NOT NULL,
    "Amount" decimal(18,2) NOT NULL,
    "Status" integer NOT NULL DEFAULT 0,
    "Notes" text,
    "CreatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "UpdatedAt" timestamp with time zone NOT NULL DEFAULT NOW(),
    "IsDeleted" boolean NOT NULL DEFAULT FALSE,
    CONSTRAINT "FK_PurchaseReturns_PurchaseOrders" FOREIGN KEY ("PurchaseOrderId") 
        REFERENCES "PurchaseOrders"("Id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_GoodsReceipts_TenantId" ON "GoodsReceipts"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_GoodsReceipts_PurchaseOrderId" ON "GoodsReceipts"("PurchaseOrderId");
CREATE INDEX IF NOT EXISTS "IX_GoodsReceiptItems_GoodsReceiptId" ON "GoodsReceiptItems"("GoodsReceiptId");
CREATE INDEX IF NOT EXISTS "IX_GoodsReceiptItems_PurchaseOrderItemId" ON "GoodsReceiptItems"("PurchaseOrderItemId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseReturns_TenantId" ON "PurchaseReturns"("TenantId");
CREATE INDEX IF NOT EXISTS "IX_PurchaseReturns_PurchaseOrderId" ON "PurchaseReturns"("PurchaseOrderId");
