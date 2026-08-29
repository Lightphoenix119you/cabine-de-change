/*
# Reconcile live database with the application (post-audit)

This project's actual Supabase database had drifted significantly from
what the application code expects — confirmed by a full schema dump:
  - `cabins` was missing: phone, whatsapp, base_currency, base_symbol,
    local_currency, local_symbol. It has `updated_at` where the app
    expected `rates_updated_at` (the app is updated to use the real
    column instead of adding a duplicate).
  - `vendors` only had id/cabin_id/name — missing business_type,
    photo_url, status, price_info, phone, latitude, longitude, created_at.
  - `vendor_products` was missing `unit`.
  - `conversations` was missing vendor_id, client_id, client_name.
  - `messages` did not exist at all.
  - 0 custom functions existed in `public` — meaning the operator-auth
    RLS layer (helper functions + claim trigger) from an earlier
    migration was never actually applied here, despite `cabins.operator_id`
    existing. Policies present were generic ("Allow write access on X",
    "Allow public read access on X", "Modification autorisee") — almost
    certainly USING(true), i.e. fully public writes.

Columns confirmed unused by anything else and deliberately left alone:
usd_buy_rate, usd_sell_rate, is_active is KEPT and wired to the "Ouvert"
badge (per instruction), opening_time, closing_time, opening_hours,
start_time, open_time, close_time, last_updated.

Every step below uses IF NOT EXISTS / OR REPLACE / DROP IF EXISTS so this
migration is safe to run more than once.
*/

-- ============================================================
-- 1. cabins — add columns the app actually reads/writes
-- ============================================================
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS whatsapp text;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS base_currency text NOT NULL DEFAULT 'USD';
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS base_symbol text NOT NULL DEFAULT '$';
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS local_currency text NOT NULL DEFAULT 'CDF';
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS local_symbol text NOT NULL DEFAULT 'FC';
ALTER TABLE cabins ALTER COLUMN is_active SET DEFAULT true;
UPDATE cabins SET is_active = true WHERE is_active IS NULL;

-- ============================================================
-- 2. vendors — bring up to full schema
-- ============================================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS business_type text NOT NULL DEFAULT 'Vendeur';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'available'
  CHECK (status IN ('available', 'out_of_stock'));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS price_info text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS longitude double precision;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- ============================================================
-- 3. vendor_products — add unit
-- ============================================================
ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS unit text;

-- ============================================================
-- 4. conversations — messaging identity columns
-- ============================================================
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS vendor_id uuid REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS client_id text;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS client_name text;

CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_thread
  ON conversations (cabin_id, COALESCE(vendor_id, '00000000-0000-0000-0000-000000000000'::uuid), client_id);

-- ============================================================
-- 5. messages — new table
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'operator')),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id, created_at);

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

-- ============================================================
-- 6. operator-auth layer — recreated from scratch (never applied here)
-- ============================================================
CREATE OR REPLACE FUNCTION is_cabin_operator(check_cabin_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM cabins WHERE id = check_cabin_id AND operator_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION is_vendor_operator(check_vendor_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM vendors v JOIN cabins c ON c.id = v.cabin_id
    WHERE v.id = check_vendor_id AND c.operator_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION can_access_conversation(check_conversation_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversations
    WHERE id = check_conversation_id
      AND (client_id = auth.uid()::text OR is_cabin_operator(cabin_id))
  );
$$;

CREATE OR REPLACE FUNCTION claim_unclaimed_cabin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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

-- ============================================================
-- 7. RLS — drop every ad-hoc policy actually found on this project,
--    enable RLS explicitly on every table, recreate clean policies
-- ============================================================

-- cabins
DROP POLICY IF EXISTS "Modification autorisee" ON cabins;
DROP POLICY IF EXISTS "Allow write access on cabins" ON cabins;
DROP POLICY IF EXISTS "Allow public read access on cabins" ON cabins;
DROP POLICY IF EXISTS "Lecture publique des cabines" ON cabins;
ALTER TABLE cabins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_cabins" ON cabins FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "operator_insert_cabins" ON cabins FOR INSERT TO authenticated
  WITH CHECK (operator_id = auth.uid());
CREATE POLICY "operator_update_cabins" ON cabins FOR UPDATE TO authenticated
  USING (operator_id = auth.uid() OR operator_id IS NULL) WITH CHECK (operator_id = auth.uid());
CREATE POLICY "operator_delete_cabins" ON cabins FOR DELETE TO authenticated
  USING (operator_id = auth.uid());

-- vendors
DROP POLICY IF EXISTS "Allow write access on vendors" ON vendors;
DROP POLICY IF EXISTS "Allow public read access on vendors" ON vendors;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_vendors" ON vendors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "operator_insert_vendors" ON vendors FOR INSERT TO authenticated
  WITH CHECK (is_cabin_operator(cabin_id));
CREATE POLICY "operator_update_vendors" ON vendors FOR UPDATE TO authenticated
  USING (is_cabin_operator(cabin_id)) WITH CHECK (is_cabin_operator(cabin_id));
CREATE POLICY "operator_delete_vendors" ON vendors FOR DELETE TO authenticated
  USING (is_cabin_operator(cabin_id));

-- vendor_products
DROP POLICY IF EXISTS "Allow write access on vendor_products" ON vendor_products;
DROP POLICY IF EXISTS "Allow public read access on vendor_products" ON vendor_products;
ALTER TABLE vendor_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_select_vendor_products" ON vendor_products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "operator_insert_vendor_products" ON vendor_products FOR INSERT TO authenticated
  WITH CHECK (is_vendor_operator(vendor_id));
CREATE POLICY "operator_update_vendor_products" ON vendor_products FOR UPDATE TO authenticated
  USING (is_vendor_operator(vendor_id)) WITH CHECK (is_vendor_operator(vendor_id));
CREATE POLICY "operator_delete_vendor_products" ON vendor_products FOR DELETE TO authenticated
  USING (is_vendor_operator(vendor_id));

-- conversations
DROP POLICY IF EXISTS "Allow write access on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow public read access on conversations" ON conversations;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participant_select_conversations" ON conversations FOR SELECT TO authenticated
  USING (client_id = auth.uid()::text OR is_cabin_operator(cabin_id));
CREATE POLICY "participant_insert_conversations" ON conversations FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid()::text OR is_cabin_operator(cabin_id));
CREATE POLICY "operator_update_conversations" ON conversations FOR UPDATE TO authenticated
  USING (is_cabin_operator(cabin_id)) WITH CHECK (is_cabin_operator(cabin_id));
CREATE POLICY "operator_delete_conversations" ON conversations FOR DELETE TO authenticated
  USING (is_cabin_operator(cabin_id));

-- messages (new table, no old policies)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participant_select_messages" ON messages FOR SELECT TO authenticated
  USING (can_access_conversation(conversation_id));
CREATE POLICY "participant_insert_messages" ON messages FOR INSERT TO authenticated
  WITH CHECK (
    can_access_conversation(conversation_id) AND (
      (sender_role = 'client' AND (SELECT client_id FROM conversations WHERE id = conversation_id) = auth.uid()::text)
      OR (sender_role = 'operator' AND is_cabin_operator((SELECT cabin_id FROM conversations WHERE id = conversation_id)))
    )
  );

-- ============================================================
-- 8. Realtime
-- ============================================================
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
