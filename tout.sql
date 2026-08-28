\set ON_ERROR_STOP on

-- ==========================================
-- 1. CRÉATION DE STRUCTURE & AJOUT DE COLONNES (SAFE)
-- ==========================================

-- Table Cabins
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
  updated_at timestamptz DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  operator_id uuid REFERENCES auth.users(id),
  latitude double precision,
  longitude double precision
);

ALTER TABLE cabins ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS base_currency text NOT NULL DEFAULT 'USD';
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS base_symbol text NOT NULL DEFAULT '$';
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS local_currency text NOT NULL DEFAULT 'CDF';
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS local_symbol text NOT NULL DEFAULT 'FC';
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS buy_rate numeric NOT NULL DEFAULT 2800;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS sell_rate numeric NOT NULL DEFAULT 2850;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES auth.users(id);
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS longitude double precision;

-- Table Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL REFERENCES cabins(id) ON DELETE CASCADE,
  name text NOT NULL,
  business_type text NOT NULL DEFAULT 'Vendeur',
  photo_url text,
  status text NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'out_of_stock')),
  price_info text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  latitude double precision,
  longitude double precision
);

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_type text NOT NULL DEFAULT 'Vendeur';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available'
  CHECK (status IN ('available', 'out_of_stock'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS price_info text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Table Vendor Products
CREATE TABLE IF NOT EXISTS vendor_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  unit text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS unit text;

CREATE INDEX IF NOT EXISTS vendor_products_vendor_id_idx ON vendor_products(vendor_id);

-- Table Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cabin_id uuid NOT NULL REFERENCES cabins(id) ON DELETE CASCADE,
  vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  client_name text,
  last_message_at timestamptz,
  operator_last_read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS operator_last_read_at timestamptz;

CREATE INDEX IF NOT EXISTS conversations_cabin_id_idx ON conversations(cabin_id);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_thread
  ON conversations (cabin_id, COALESCE(vendor_id, '00000000-0000-0000-0000-000000000000'::uuid), client_id);

-- Table Messages
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'operator')),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_conversation_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id, created_at);

-- ==========================================
-- 2. FONCTIONS ET TRIGGERS
-- ==========================================

CREATE OR REPLACE FUNCTION touch_conversation_last_message()
RETURNS trigger AS $$
BEGIN
  UPDATE conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_conversation_last_message ON messages;
CREATE TRIGGER trg_touch_conversation_last_message
AFTER INSERT ON messages
FOR EACH ROW EXECUTE FUNCTION touch_conversation_last_message();

CREATE OR REPLACE FUNCTION is_cabin_operator(check_cabin_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM cabins WHERE id = check_cabin_id AND operator_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_vendor_operator(check_vendor_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendors v
    JOIN cabins c ON c.id = v.cabin_id
    WHERE v.id = check_vendor_id AND c.operator_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION can_access_conversation(check_conversation_id uuid)
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = check_conversation_id
      AND (client_id = auth.uid()::text OR is_cabin_operator(cabin_id))
  );
$$;

CREATE OR REPLACE FUNCTION claim_unclaimed_cabin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_anonymous IS NOT TRUE THEN
    UPDATE cabins SET operator_id = NEW.id WHERE operator_id IS NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_claim_cabin ON auth.users;
CREATE TRIGGER on_auth_user_created_claim_cabin
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION claim_unclaimed_cabin();

-- ==========================================
-- 3. POLITIQUES DE SÉCURITÉ (RLS)
-- ==========================================

ALTER TABLE cabins ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Cabins Policies
DROP POLICY IF EXISTS "anon_select_cabins" ON cabins;
DROP POLICY IF EXISTS "anon_insert_cabins" ON cabins;
DROP POLICY IF EXISTS "anon_update_cabins" ON cabins;
DROP POLICY IF EXISTS "anon_delete_cabins" ON cabins;
DROP POLICY IF EXISTS "operator_insert_cabins" ON cabins;
DROP POLICY IF EXISTS "operator_update_cabins" ON cabins;
DROP POLICY IF EXISTS "operator_delete_cabins" ON cabins;
DROP POLICY IF EXISTS "Modification autorisee" ON cabins;
DROP POLICY IF EXISTS "Allow write access on cabins" ON cabins;
DROP POLICY IF EXISTS "Allow public read access on cabins" ON cabins;
DROP POLICY IF EXISTS "Lecture publique des cabines" ON cabins;

CREATE POLICY "anon_select_cabins" ON cabins FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "operator_insert_cabins" ON cabins FOR INSERT TO authenticated WITH CHECK (operator_id = auth.uid());
CREATE POLICY "operator_update_cabins" ON cabins FOR UPDATE TO authenticated USING (operator_id = auth.uid() OR operator_id IS NULL) WITH CHECK (operator_id = auth.uid());
CREATE POLICY "operator_delete_cabins" ON cabins FOR DELETE TO authenticated USING (operator_id = auth.uid());

-- Vendors Policies
DROP POLICY IF EXISTS "anon_select_vendors" ON vendors;
DROP POLICY IF EXISTS "anon_insert_vendors" ON vendors;
DROP POLICY IF EXISTS "anon_update_vendors" ON vendors;
DROP POLICY IF EXISTS "anon_delete_vendors" ON vendors;
DROP POLICY IF EXISTS "operator_insert_vendors" ON vendors;
DROP POLICY IF EXISTS "operator_update_vendors" ON vendors;
DROP POLICY IF EXISTS "operator_delete_vendors" ON vendors;
DROP POLICY IF EXISTS "Allow write access on vendors" ON vendors;
DROP POLICY IF EXISTS "Allow public read access on vendors" ON vendors;

CREATE POLICY "anon_select_vendors" ON vendors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "operator_insert_vendors" ON vendors FOR INSERT TO authenticated WITH CHECK (is_cabin_operator(cabin_id));
CREATE POLICY "operator_update_vendors" ON vendors FOR UPDATE TO authenticated USING (is_cabin_operator(cabin_id)) WITH CHECK (is_cabin_operator(cabin_id));
CREATE POLICY "operator_delete_vendors" ON vendors FOR DELETE TO authenticated USING (is_cabin_operator(cabin_id));

-- Vendor Products Policies
DROP POLICY IF EXISTS "anon_select_vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "anon_insert_vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "anon_update_vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "anon_delete_vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "operator_insert_vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "operator_update_vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "operator_delete_vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "Allow write access on vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "Allow public read access on vendor_products" ON vendor_products;

CREATE POLICY "anon_select_vendor_products" ON vendor_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "operator_insert_vendor_products" ON vendor_products FOR INSERT TO authenticated WITH CHECK (is_vendor_operator(vendor_id));
CREATE POLICY "operator_update_vendor_products" ON vendor_products FOR UPDATE TO authenticated USING (is_vendor_operator(vendor_id)) WITH CHECK (is_vendor_operator(vendor_id));
CREATE POLICY "operator_delete_vendor_products" ON vendor_products FOR DELETE TO authenticated USING (is_vendor_operator(vendor_id));

-- Conversations Policies
DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
DROP POLICY IF EXISTS "participant_select_conversations" ON conversations;
DROP POLICY IF EXISTS "participant_insert_conversations" ON conversations;
DROP POLICY IF EXISTS "operator_update_conversations" ON conversations;
DROP POLICY IF EXISTS "operator_delete_conversations" ON conversations;
DROP POLICY IF EXISTS "Allow write access on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow public read access on conversations" ON conversations;

CREATE POLICY "participant_select_conversations" ON conversations FOR SELECT TO authenticated USING (client_id = auth.uid()::text OR is_cabin_operator(cabin_id));
CREATE POLICY "participant_insert_conversations" ON conversations FOR INSERT TO authenticated WITH CHECK (client_id = auth.uid()::text OR is_cabin_operator(cabin_id));
CREATE POLICY "operator_update_conversations" ON conversations FOR UPDATE TO authenticated USING (is_cabin_operator(cabin_id)) WITH CHECK (is_cabin_operator(cabin_id));
CREATE POLICY "operator_delete_conversations" ON conversations FOR DELETE TO authenticated USING (is_cabin_operator(cabin_id));

-- Messages Policies
DROP POLICY IF EXISTS "anon_select_messages" ON messages;
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
DROP POLICY IF EXISTS "participant_select_messages" ON messages;
DROP POLICY IF EXISTS "participant_insert_messages" ON messages;

CREATE POLICY "participant_select_messages" ON messages FOR SELECT TO authenticated USING (can_access_conversation(conversation_id));
CREATE POLICY "participant_insert_messages" ON messages FOR INSERT TO authenticated WITH CHECK (
  can_access_conversation(conversation_id)
  AND (
    (sender_role = 'client' AND (SELECT client_id FROM conversations WHERE id = conversation_id) = auth.uid()::text)
    OR (sender_role = 'operator' AND is_cabin_operator((SELECT cabin_id FROM conversations WHERE id = conversation_id)))
  )
);

-- ==========================================
-- 4. INITIALISATION DES DONNÉES ET REALTIME
-- ==========================================

INSERT INTO cabins (name, location, phone, whatsapp, base_currency, base_symbol, local_currency, local_symbol, buy_rate, sell_rate)
SELECT
  'Cabine Change Kongo',
  'Avenue du Marché, Matadi',
  '+243 900 000 000',
  '+243900000000',
  'USD',
  '$',
  'CDF',
  'FC',
  2800,
  2850
WHERE NOT EXISTS (SELECT 1 FROM cabins);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;
END $$;
