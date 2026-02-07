-- Add contentType column
ALTER TABLE "Item" ADD COLUMN "contentType" TEXT;

-- Migrate from macro to contentType
UPDATE "Item" 
SET "contentType" = 'SPRINT' 
WHERE "macro" = 'SNACK';

UPDATE "Item" 
SET "contentType" = 'SESSION' 
WHERE "macro" = 'MEAL';

UPDATE "Item" 
SET "contentType" = 'JOURNEY' 
WHERE "macro" = 'TIME_TESTED';

-- Set default for any remaining NULL contentType values
UPDATE "Item" 
SET "contentType" = 'SESSION' 
WHERE "contentType" IS NULL;
