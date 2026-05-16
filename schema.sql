-- ============================================================
-- PocketLedger — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- INCOMES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incomes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  source        TEXT NOT NULL,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own incomes"
  ON incomes FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- EXPENSES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category      TEXT NOT NULL DEFAULT 'Other',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note          TEXT,
  receipt_url   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own expenses"
  ON expenses FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- PEOPLE LEDGER
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS people_ledger (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_name      TEXT NOT NULL,
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  note             TEXT,
  gave_money       BOOLEAN DEFAULT FALSE,  -- I gave money to person
  took_money       BOOLEAN DEFAULT FALSE,  -- I took/received money from person
  owes_me          BOOLEAN DEFAULT FALSE,  -- Person owes me (unpaid)
  i_owe            BOOLEAN DEFAULT FALSE,  -- I owe person (unpaid)
  is_settled       BOOLEAN DEFAULT FALSE,  -- Transaction settled/cleared
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE people_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ledger"
  ON people_ledger FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- BILLS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  amount      NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  due_date    DATE,
  is_paid     BOOLEAN DEFAULT FALSE,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bills"
  ON bills FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- NOTES
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  content    TEXT,
  is_pinned  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own notes"
  ON notes FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- SETTINGS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id  UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme    TEXT DEFAULT 'dark',
  language TEXT DEFAULT 'en',
  currency TEXT DEFAULT 'BDT',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings"
  ON settings FOR ALL USING (auth.uid() = user_id);

-- ─────────────────────────────────────────────
-- STORAGE BUCKET for receipts
-- ─────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → New Bucket
-- Name: receipts | Public: false

-- Storage RLS (paste in SQL editor after creating bucket)
-- CREATE POLICY "Auth users upload receipts"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
-- CREATE POLICY "Users view own receipts"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'receipts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ─────────────────────────────────────────────
-- Auto-update updated_at triggers
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

