-- ====================================================
-- FINANCE TRACKER - DATABASE MIGRATION
-- Esegui questo script nel SQL Editor di Supabase
-- ====================================================

-- 1. Tabella categorie
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT DEFAULT '📁',
  color TEXT DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserisci alcune categorie di default
INSERT INTO categories (name, icon, color) VALUES
  ('Spesa', '🛒', '#22C55E'),
  ('Fitness', '💪', '#06B6D4'),
  ('Trasporti', '🚌', '#3B82F6'),
  ('Telefono', '📱', '#64748B'),
  ('Macchina', '🚗', '#EF4444'),
  ('Motorino', '🛵', '#F97316'),
  ('Spese Mediche', '💊', '#14B8A6'),
  ('Pasti Fuori', '🍽️', '#EAB308'),
  ('Caffè/Aperitivi', '☕', '#F59E0B'),
  ('Shopping', '🛍️', '#EC4899'),
  ('Svago', '🎉', '#A855F7'),
  ('Spotify', '🎵', '#1DB954'),
  ('iCloud', '☁️', '#007AFF'),
  ('Abbigliamento', '👕', '#6366F1'),
  ('Regali', '🎁', '#F43F5E'),
  ('Imprevisti', '⚠️', '#94A3B8'),
  ('Fondo Pensione', '👴', '#10B981'),
  ('Amazon Prime', '📦', '#00A8E1'),
  ('Viaggi', '✈️', '#0EA5E9'),
  ('Arredo Casa', '🏠', '#D946EF')
ON CONFLICT (name) DO NOTHING;

-- 2. Tabella regole enti (merchant rules)
CREATE TABLE IF NOT EXISTS merchant_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_pattern TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabella saldi mensili
CREATE TABLE IF NOT EXISTS monthly_balances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  starting_balance DECIMAL(12,2),
  ending_balance DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 4. Aggiungi colonne alla tabella transactions esistente
ALTER TABLE transactions 
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false;

-- 5. Abilita RLS (Row Level Security) sulle nuove tabelle
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_balances ENABLE ROW LEVEL SECURITY;

-- 6. Policy per accesso pubblico (per semplicità - modifica se serve autenticazione)
CREATE POLICY "Allow all access to categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to merchant_rules" ON merchant_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to monthly_balances" ON monthly_balances FOR ALL USING (true) WITH CHECK (true);

-- 7. Indice per migliorare ricerca merchant pattern
CREATE INDEX IF NOT EXISTS idx_merchant_rules_pattern ON merchant_rules(merchant_pattern);

-- ====================================================
-- FINE MIGRAZIONE
-- ====================================================
