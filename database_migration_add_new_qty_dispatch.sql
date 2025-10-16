-- Migration script to add new_qty_dispatch column to dispatch_details table
-- Run this script to add the new column

ALTER TABLE dispatch_details 
ADD COLUMN new_qty_dispatch DECIMAL(10,3) DEFAULT 0 AFTER qty_dispatch;

-- Update existing records to set new_qty_dispatch = qty_dispatch initially
UPDATE dispatch_details 
SET new_qty_dispatch = qty_dispatch 
WHERE new_qty_dispatch = 0;

-- Add index for better performance
CREATE INDEX idx_new_qty_dispatch ON dispatch_details(new_qty_dispatch);
