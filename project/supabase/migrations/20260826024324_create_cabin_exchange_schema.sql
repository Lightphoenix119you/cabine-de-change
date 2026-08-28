/*
# Create currency exchange cabin schema (single-tenant, no auth)

1. Overview
   This app is a public-facing mobile web app for a single local currency-exchange
   cabin ("cabine de change") and its nearby micro-vendors. There is no sign-in
   screen, so all data is intentionally public/shared and policies are scoped to
   both anon and authenticated roles.

2. New Tables
   - `cabins`: a single row describing the cabin (name, location, contact, rates).
     - id (uuid, primary key)
     - name (text, not null) — display name of the cabin
     - location (text) — human-readable location/neighborhood
     - phone (text) — contact phone number
     - whatsapp (text) — WhatsApp number for click-to-chat
     - base_currency (text, default 'USD') — currency the cabin trades from
     - base_symbol (text, default '$')
     - local_currency (text, default 'CDF') — local currency code
     - local_symbol (text, default 'FC')
     - buy_rate (numeric) — rate at which cabin buys base currency (pays local)
     - sell_rate (numeric) — rate at which cabin sells base currency (receives local)
     - rates_updated_at (timestamptz) — last time operator updated rates
     - created_at (timestamptz)
   - `vendors`: micro-vendors attached to the cabin ("Marché du quartier").
     - id (uuid, primary key)
     - cabin_id (uuid, references cabins, cascade delete)
     - name (text, not null)
     - business_type (text, not null) — e.g. Beignets, Fruits, Food
     - photo_url (text) — image URL
     - status (text, default 'available') — 'available' | 'out_of_stock'
     - price_info (text) — free-text price/description
     - phone (text) — vendor contact
     - created_at (timestamptz)

3. Security
   - Enable RLS on both tables.
   - Public CRUD for anon + authenticated because the app has no login and the
     data is intentionally shared (operator edits happen via an in-app admin
     toggle, not a signed-in user).
*/

CREATE TABLE IF NOT EXISTS cabins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  phone text,
  whatsapp text,
  base_currency text NOT NULL DEFAULT 'USD',
  base_symbol text NOT NULL DEFAULT '$',
  local_currency text NOT NULL DEFAULT 'CDF',
  local_symbol text NOT NULL DEFAULT 'FC',
  buy_rate numeric NOT NULL DEFAULT 2800,
  sell_rate numeric NOT NULL DEFAULT 2850,
  rates_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL REFERENCES cabins(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'available',
  price_info text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- cabins policies (public read/write, single-tenant no-auth app)
DROP POLICY IF EXISTS "anon_select_cabins" ON cabins;
CREATE POLICY "anon_select_cabins" ON cabins FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_cabins" ON cabins;
CREATE POLICY "anon_insert_cabins" ON cabins FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_cabins" ON cabins;
CREATE POLICY "anon_update_cabins" ON cabins FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_cabins" ON cabins;
CREATE POLICY "anon_delete_cabins" ON cabins FOR DELETE
  TO anon, authenticated USING (true);

-- vendors policies (public read/write, single-tenant no-auth app)
DROP POLICY IF EXISTS "anon_select_vendors" ON vendors;
CREATE POLICY "anon_select_vendors" ON vendors FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vendors" ON vendors;
CREATE POLICY "anon_insert_vendors" ON vendors FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vendors" ON vendors;
CREATE POLICY "anon_update_vendors" ON vendors FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vendors" ON vendors;
CREATE POLICY "anon_delete_vendors" ON vendors FOR DELETE
  TO anon, authenticated USING (true);
