/*
# Add operator authentication and lock down write/read access

Context: every previous migration used fully public policies (USING true)
because the app had no login. That was fine for intentionally-public data
(rates, vendor listings) but not for private chat threads, and it also
meant anyone could rewrite the cabin's rates from devtools. This migration
adds a real operator account and uses it everywhere access should actually
be restricted.

1. Cabins gain an `operator_id` (references auth.users). The cabin starts
   unclaimed (operator_id null). A trigger on auth.users claims the first
   unclaimed cabin for the first REAL (non-anonymous) signup — so the
   operator just has to sign up once, before sharing the app publicly.
   Anonymous sessions (used for client chat identity, see below) are
   explicitly excluded from claiming.

2. Helper functions `is_cabin_operator` / `is_vendor_operator` centralize
   "is the current user the operator of this cabin/vendor" for reuse
   across policies.

3. Write policies on cabins/vendors/vendor_products now require
   is_cabin_operator / is_vendor_operator instead of being fully public.
   Their SELECT policies stay public — the storefront itself is still
   meant to be open to everyone.

4. conversations/messages: clients now get a real (anonymous) Supabase
   Auth session instead of a self-declared client_id string, so RLS can
   actually tell participants apart. A thread (and its messages) is only
   readable/writable by its client (auth.uid() = client_id) or by the
   cabin's operator. Messages also check sender_role against the actual
   caller so a client can't insert a message impersonating the operator
   (or vice versa).
*/

ALTER TABLE cabins ADD COLUMN IF NOT EXISTS operator_id uuid REFERENCES auth.users(id);

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

-- claim the first unclaimed cabin on the first real (non-anonymous) signup
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

-- cabins: keep public read, restrict writes to the operator (or claiming when unclaimed)
DROP POLICY IF EXISTS "anon_insert_cabins" ON cabins;
CREATE POLICY "operator_insert_cabins" ON cabins FOR INSERT
  TO authenticated WITH CHECK (operator_id = auth.uid());

DROP POLICY IF EXISTS "anon_update_cabins" ON cabins;
CREATE POLICY "operator_update_cabins" ON cabins FOR UPDATE
  TO authenticated USING (operator_id = auth.uid() OR operator_id IS NULL)
  WITH CHECK (operator_id = auth.uid());

DROP POLICY IF EXISTS "anon_delete_cabins" ON cabins;
CREATE POLICY "operator_delete_cabins" ON cabins FOR DELETE
  TO authenticated USING (operator_id = auth.uid());

-- vendors: keep public read, restrict writes to the cabin's operator
DROP POLICY IF EXISTS "anon_insert_vendors" ON vendors;
CREATE POLICY "operator_insert_vendors" ON vendors FOR INSERT
  TO authenticated WITH CHECK (is_cabin_operator(cabin_id));

DROP POLICY IF EXISTS "anon_update_vendors" ON vendors;
CREATE POLICY "operator_update_vendors" ON vendors FOR UPDATE
  TO authenticated USING (is_cabin_operator(cabin_id)) WITH CHECK (is_cabin_operator(cabin_id));

DROP POLICY IF EXISTS "anon_delete_vendors" ON vendors;
CREATE POLICY "operator_delete_vendors" ON vendors FOR DELETE
  TO authenticated USING (is_cabin_operator(cabin_id));

-- vendor_products: keep public read, restrict writes to the vendor's operator
DROP POLICY IF EXISTS "anon_insert_vendor_products" ON vendor_products;
CREATE POLICY "operator_insert_vendor_products" ON vendor_products FOR INSERT
  TO authenticated WITH CHECK (is_vendor_operator(vendor_id));

DROP POLICY IF EXISTS "anon_update_vendor_products" ON vendor_products;
CREATE POLICY "operator_update_vendor_products" ON vendor_products FOR UPDATE
  TO authenticated USING (is_vendor_operator(vendor_id)) WITH CHECK (is_vendor_operator(vendor_id));

DROP POLICY IF EXISTS "anon_delete_vendor_products" ON vendor_products;
CREATE POLICY "operator_delete_vendor_products" ON vendor_products FOR DELETE
  TO authenticated USING (is_vendor_operator(vendor_id));

-- conversations: only the thread's client or the cabin's operator
DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "participant_select_conversations" ON conversations FOR SELECT
  TO authenticated USING (client_id = auth.uid()::text OR is_cabin_operator(cabin_id));

DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "participant_insert_conversations" ON conversations FOR INSERT
  TO authenticated WITH CHECK (client_id = auth.uid()::text OR is_cabin_operator(cabin_id));

DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "operator_update_conversations" ON conversations FOR UPDATE
  TO authenticated USING (is_cabin_operator(cabin_id)) WITH CHECK (is_cabin_operator(cabin_id));

DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "operator_delete_conversations" ON conversations FOR DELETE
  TO authenticated USING (is_cabin_operator(cabin_id));

-- messages: only participants of the parent conversation, and only as themselves
DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "participant_select_messages" ON messages FOR SELECT
  TO authenticated USING (can_access_conversation(conversation_id));

DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "participant_insert_messages" ON messages FOR INSERT
  TO authenticated WITH CHECK (
    can_access_conversation(conversation_id)
    AND (
      (sender_role = 'client' AND (SELECT client_id FROM conversations WHERE id = conversation_id) = auth.uid()::text)
      OR (sender_role = 'operator' AND is_cabin_operator((SELECT cabin_id FROM conversations WHERE id = conversation_id)))
    )
  );
