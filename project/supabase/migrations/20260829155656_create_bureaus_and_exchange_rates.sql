/*
# Create bureaus and exchange_rates tables for Cabine de Change

## Purpose
Stores Kinshasa currency-exchange bureaus and their USD/CDF exchange rates.
The app launches with zero rows — no fake bureaus, rates, or reviews are seeded.

## New Tables

### bureaus
- `id` (uuid, primary key, auto-generated)
- `name` (text, not null) — bureau name
- `municipality` (text, not null) — commune (Gombe, Ngaliema, Limete, etc.)
- `address` (text) — street address / landmark notes
- `phone` (text) — contact number
- `latitude` (double precision) — map latitude
- `longitude` (double precision) — map longitude
- `verified` (boolean, default false) — true once an admin has validated the bureau
- `created_at` (timestamptz, default now())

### exchange_rates
- `id` (uuid, primary key, auto-generated)
- `bureau_id` (uuid, foreign key → bureaus.id ON DELETE CASCADE)
- `usd_buy` (numeric) — rate at which the bureau buys USD (you sell USD)
- `usd_sell` (numeric) — rate at which the bureau sells USD (you buy USD)
- `status` (text, check in ('pending','verified'), default 'pending') — pending = community-reported, verified = admin-approved
- `updated_at` (timestamptz, default now())

## Security (Row Level Security)

RLS is enabled on BOTH tables from this first migration.

### bureaus
- SELECT: public (anon + authenticated) — the directory is meant to be public.
- INSERT: public (anon + authenticated) but only with `verified = false`, so community
  members can report a new bureau that remains unverified until an admin approves it.
- UPDATE: restricted to the authenticated admin (JWT email matches the configured admin
  email). Used to flip `verified` to true or edit bureau details.
- DELETE: restricted to the authenticated admin.

### exchange_rates
- SELECT: public (anon + authenticated) — both verified and pending rows are readable so
  the app can show a clearly-labeled "unverified / community-reported" section. The UI
  never blends the two without a visual distinction.
- INSERT: public (anon + authenticated) but `status` is forced to 'pending' via
  WITH CHECK (status = 'pending'). A submitter cannot self-approve their own report.
- UPDATE: restricted to the authenticated admin — used to approve a report
  (set status = 'verified').
- DELETE: restricted to the authenticated admin.

The admin email used in the UPDATE/DELETE policies is `admin@cabinedechange.cd`.
Only a user who authenticates with that exact email can approve rates or manage bureaus.

## Indexes
- Index on `exchange_rates.bureau_id` for fast joins.
- Index on `exchange_rates.status` for filtering verified/pending.
- Index on `bureaus.municipality` for filtering by commune.

## Notes
1. No seed data. The app renders honest empty states when tables are empty.
2. `updated_at` is set on insert; a trigger updates it on every row change so the
   dashboard can sort by most-recently-updated rates.
*/

CREATE TABLE IF NOT EXISTS bureaus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  municipality text NOT NULL,
  address text,
  phone text,
  latitude double precision,
  longitude double precision,
  verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id uuid NOT NULL REFERENCES bureaus(id) ON DELETE CASCADE,
  usd_buy numeric,
  usd_sell numeric,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE bureaus ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

-- bureaus policies
DROP POLICY IF EXISTS "public_select_bureaus" ON bureaus;
CREATE POLICY "public_select_bureaus"
  ON bureaus FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_unverified_bureaus" ON bureaus;
CREATE POLICY "public_insert_unverified_bureaus"
  ON bureaus FOR INSERT
  TO anon, authenticated WITH CHECK (verified = false);

DROP POLICY IF EXISTS "admin_update_bureaus" ON bureaus;
CREATE POLICY "admin_update_bureaus"
  ON bureaus FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@cabinedechange.cd')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@cabinedechange.cd');

DROP POLICY IF EXISTS "admin_delete_bureaus" ON bureaus;
CREATE POLICY "admin_delete_bureaus"
  ON bureaus FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@cabinedechange.cd');

-- exchange_rates policies
DROP POLICY IF EXISTS "public_select_exchange_rates" ON exchange_rates;
CREATE POLICY "public_select_exchange_rates"
  ON exchange_rates FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_pending_rates" ON exchange_rates;
CREATE POLICY "public_insert_pending_rates"
  ON exchange_rates FOR INSERT
  TO anon, authenticated WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "admin_update_exchange_rates" ON exchange_rates;
CREATE POLICY "admin_update_exchange_rates"
  ON exchange_rates FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@cabinedechange.cd')
  WITH CHECK (auth.jwt() ->> 'email' = 'admin@cabinedechange.cd');

DROP POLICY IF EXISTS "admin_delete_exchange_rates" ON exchange_rates;
CREATE POLICY "admin_delete_exchange_rates"
  ON exchange_rates FOR DELETE
  TO authenticated
  USING (auth.jwt() ->> 'email' = 'admin@cabinedechange.cd');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_bureau_id ON exchange_rates(bureau_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_status ON exchange_rates(status);
CREATE INDEX IF NOT EXISTS idx_bureaus_municipality ON bureaus(municipality);

-- Auto-update updated_at on every row change
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exchange_rates_updated_at ON exchange_rates;
CREATE TRIGGER trg_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();