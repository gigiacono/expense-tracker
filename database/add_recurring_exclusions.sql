-- Table to track recurring transactions that were explicitly deleted for a given month.
-- This prevents ensureRecurringTransactions from recreating them.
CREATE TABLE IF NOT EXISTS recurring_exclusions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month, description, amount, type)
);

-- RLS + Policy
ALTER TABLE recurring_exclusions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all access to recurring_exclusions" ON recurring_exclusions FOR ALL USING (true) WITH CHECK (true);
