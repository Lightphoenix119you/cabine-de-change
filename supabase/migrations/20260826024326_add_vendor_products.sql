/*
# Add vendor products (structured price list)

1. New Tables
   - `vendor_products`: line items belonging to a vendor — what the client
     asked for as "ses prix de vente de ses produits, ses unités", shown on
     the vendor's profile screen (separate from the short `price_info`
     summary text already shown on the vendor card).
     - id (uuid, primary key)
     - vendor_id (uuid, references vendors, cascade delete)
     - name (text, not null) — product name, e.g. "Beignets"
     - price (numeric, not null) — sale price in local currency
     - unit (text) — e.g. "pièce", "kg", "sachet"
     - created_at (timestamptz)

2. Security
   - Enable RLS. Same public-read/write model as `cabins` and `vendors`:
     this app has no login, operators edit via the in-app admin toggle.
*/

CREATE TABLE IF NOT EXISTS vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  unit text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vendor_products_vendor_id_idx ON vendor_products(vendor_id);

ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_vendor_products" ON vendor_products;
CREATE POLICY "anon_select_vendor_products" ON vendor_products FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_vendor_products" ON vendor_products;
CREATE POLICY "anon_insert_vendor_products" ON vendor_products FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_vendor_products" ON vendor_products;
CREATE POLICY "anon_update_vendor_products" ON vendor_products FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_vendor_products" ON vendor_products;
CREATE POLICY "anon_delete_vendor_products" ON vendor_products FOR DELETE
  TO anon, authenticated USING (true);
