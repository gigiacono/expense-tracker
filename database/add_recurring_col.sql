-- Add is_recurring column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Optional: Add index for performance if we query by this often
CREATE INDEX IF NOT EXISTS idx_transactions_is_recurring ON transactions(is_recurring);
