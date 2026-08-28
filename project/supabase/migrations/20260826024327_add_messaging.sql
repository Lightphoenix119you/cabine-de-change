/*
# Add in-app messaging (conversations + messages)

1. New Tables
   - `conversations`: one thread between a visiting client and either a
     specific vendor (`vendor_id` set) or the cabin operator (`vendor_id`
     null). There is no login system, so the client side of a thread is
     identified by a locally-generated `client_id` (stored in the
     visitor's browser), not a real user account.
     - id, cabin_id (fk cabins), vendor_id (fk vendors, nullable)
     - client_id (text) — client's local device identifier
     - client_name (text) — optional display name the client enters once
     - last_message_at — bumped by trigger on every new message, used to
       sort the operator's inbox
     - operator_last_read_at — set when the operator opens the thread in
       the admin dashboard, used to show an "unread" indicator
     - created_at

   - `messages`: individual messages in a conversation.
     - id, conversation_id (fk conversations, cascade delete)
     - sender_role ('client' | 'operator')
     - body (text), created_at

   A unique index prevents duplicate threads for the same
   cabin/vendor/client combination (COALESCE handles the nullable
   vendor_id, since plain UNIQUE treats NULLs as distinct).

2. Security
   - RLS enabled, same public-read/write model as the rest of this
     no-login app (see note in the first migration).
   - IMPORTANT: unlike cabin/vendor data, conversations are private
     correspondence. This public-policies model means any visitor who
     inspects the app's network calls could technically query other
     people's threads with the same anon key — this migration does not
     attempt to fix that (it would require adding a real login for the
     operator), it only keeps the same trust model already in place for
     the rest of the app. Flagged to the user separately.

3. Realtime
   - Both tables are added to the `supabase_realtime` publication so the
     chat UI can subscribe to live inserts/updates.
*/

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

CREATE INDEX IF NOT EXISTS conversations_cabin_id_idx ON conversations(cabin_id);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_thread
  ON conversations (cabin_id, COALESCE(vendor_id, '00000000-0000-0000-0000-000000000000'::uuid), client_id);

CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('client', 'operator')),
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id, created_at);

-- keep conversations.last_message_at fresh so the inbox can sort by recency
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

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_conversations" ON conversations;
CREATE POLICY "anon_select_conversations" ON conversations FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_conversations" ON conversations;
CREATE POLICY "anon_insert_conversations" ON conversations FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_conversations" ON conversations;
CREATE POLICY "anon_update_conversations" ON conversations FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_conversations" ON conversations;
CREATE POLICY "anon_delete_conversations" ON conversations FOR DELETE
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT
  TO anon, authenticated WITH CHECK (true);

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
