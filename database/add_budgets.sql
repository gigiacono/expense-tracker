-- ====================================================
-- BUDGET TABLES - Macro-categorie e allocazione percentuale
-- ====================================================

-- 1. Configurazione percentuali budget per macro-categoria
CREATE TABLE IF NOT EXISTS budget_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  macro_category TEXT NOT NULL UNIQUE CHECK (macro_category IN ('necessita', 'sfizi', 'investimenti')),
  percentage DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci valori di default (50/30/20)
INSERT INTO budget_config (macro_category, percentage) VALUES
  ('necessita', 50),
  ('sfizi', 30),
  ('investimenti', 20)
ON CONFLICT (macro_category) DO NOTHING;

-- 2. Mapping categorie -> macro-categorie
CREATE TABLE IF NOT EXISTS category_macro_mapping (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  macro_category TEXT NOT NULL CHECK (macro_category IN ('necessita', 'sfizi', 'investimenti')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id)
);

-- RLS + Policy
ALTER TABLE budget_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_macro_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to budget_config" ON budget_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to category_macro_mapping" ON category_macro_mapping FOR ALL USING (true) WITH CHECK (true);

-- ====================================================
-- FINE MIGRAZIONE BUDGET
-- ====================================================
