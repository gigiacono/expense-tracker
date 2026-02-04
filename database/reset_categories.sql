-- Script per resettare le categorie con la nuova lista personalizzata
-- ESEGUI QUESTO SCRIPT NEL SUPABASE SQL EDITOR

-- 1. Pulisci categorie esistenti
-- Nota: Questo imposterà a NULL il category_id delle transazioni esistenti e cancellerà le regole
TRUNCATE TABLE categories CASCADE;

-- 2. Inserisci le nuove categorie
INSERT INTO categories (name, icon, color) VALUES
  ('Spesa', '🛒', '#22C55E'),           -- Green
  ('Fitness', '💪', '#06B6D4'),         -- Cyan
  ('Trasporti', '🚌', '#3B82F6'),       -- Blue
  ('Telefono', '📱', '#64748B'),        -- Slate
  ('Macchina', '🚗', '#EF4444'),        -- Red
  ('Motorino', '🛵', '#F97316'),        -- Orange
  ('Spese Mediche', '💊', '#14B8A6'),   -- Teal
  ('Pasti Fuori', '🍽️', '#EAB308'),      -- Yellow
  ('Caffè/Aperitivi', '☕', '#F59E0B'),  -- Amber
  ('Shopping', '🛍️', '#EC4899'),        -- Pink
  ('Svago', '🎉', '#A855F7'),           -- Purple
  ('Spotify', '🎵', '#1DB954'),         -- Spotify Green
  ('iCloud', '☁️', '#007AFF'),          -- Apple Blue
  ('Abbigliamento', '👕', '#6366F1'),   -- Indigo
  ('Regali', '🎁', '#F43F5E'),          -- Rose
  ('Imprevisti', '⚠️', '#94A3B8'),      -- Gray
  ('Fondo Pensione', '👴', '#10B981'),  -- Emerald
  ('Amazon Prime', '📦', '#00A8E1'),    -- Prime Blue
  ('Viaggi', '✈️', '#0EA5E9'),          -- Sky
  ('Arredo Casa', '🏠', '#D946EF');     -- Fuchsia

-- 3. Verifica
SELECT * FROM categories ORDER BY name;
