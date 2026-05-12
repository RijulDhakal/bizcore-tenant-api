-- Add BatchId column to WarehouseStocks if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WarehouseStocks' AND column_name = 'BatchId'
    ) THEN
        ALTER TABLE "WarehouseStocks" ADD COLUMN "BatchId" uuid NULL;
        ALTER TABLE "WarehouseStocks" ADD CONSTRAINT "FK_WarehouseStocks_Batches_BatchId"
            FOREIGN KEY ("BatchId") REFERENCES "Batches" ("Id") ON DELETE SET NULL;
        CREATE INDEX IF NOT EXISTS "IX_WarehouseStocks_BatchId" ON "WarehouseStocks" ("BatchId");
    END IF;
END $$;
