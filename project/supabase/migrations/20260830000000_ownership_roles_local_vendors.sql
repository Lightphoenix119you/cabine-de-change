/*
# Multi-tenant ownership model: profiles, bureau ownership, local vendors

## Design decision (simplification worth flagging)
The brief asks for a "Tenu de Cabine / Agent" role. Rather than storing a
synced 'agent' role that needs promotion logic (with its own race
conditions), agent-ness is DERIVED: it's simply "do you own a row in
bureaus". `profiles.role` only ever needs two real values — 'client'
(default, everyone) and 'admin' (platform moderator) — because every
bureau-management permission below is checked via bureau ownership
(`bureaus.user_id = auth.uid()`), not via a stored role. Fewer moving
parts, nothing to keep in sync, nothing to race.

## New tables
- `profiles`: one row per real (non-anonymous) user, auto-created by a
  trigger on signup. role, full_name, phone, avatar_url.
- `local_vendors`: informal/local shops sponsored by a bureau —
  bureau_id, name, category, products_summary, photo_url, is_active,
  optional own latitude/longitude (falls back to the bureau's location
  in the UI if not set — needed for distinct map markers).

## Bureau changes
- `user_id` — the owning agent. Nullable so existing bureaus created
  before this migration (community-submitted, ownerless) keep working;
  an admin can assign an owner later via the moderation view.
- `address_description` — free-text landmark note, separate from the
  structured `address` field already present.

## Ownership + moderation rules (RLS)
- A bureau's own agent updates their OWN rates directly — these are
  auto-verified, no admin bottleneck for the source of truth. A
  community member reporting a rate for ANY bureau still lands as
  'pending' for the owner (or an admin) to confirm.
- A bureau's own agent manages their own local_vendors and bureau
  details. Creating a bureau always starts unverified — an admin (or,
  going forward, the owner improving their own listing) must confirm it.
- No self-promotion to admin is possible from the client: a trigger
  reverts any attempt to set role = 'admin' unless the caller already
  is one. The very first admin has to be set once, by hand, in the SQL
  editor (see the note at the end of this file) — there is no
  in-app path to create one, by design.
*/

-- ============================================================
-- profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  full_name text,
  phone text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- create a profile row automatically for every real signup (not anonymous)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_anonymous IS NOT TRUE THEN
    INSERT INTO profiles (id, full_name, avatar_url, phone)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name'),
      NEW.raw_user_meta_data ->> 'avatar_url',
      NEW.phone
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- no self-promotion to admin
CREATE OR REPLACE FUNCTION protect_admin_role()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.role = 'admin' AND OLD.role IS DISTINCT FROM 'admin' AND NOT is_admin() THEN
    NEW.role := OLD.role;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_admin_role ON profiles;
CREATE TRIGGER trg_protect_admin_role
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION protect_admin_role();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_or_admin_profiles" ON profiles;
CREATE POLICY "select_own_or_admin_profiles" ON profiles FOR SELECT
  TO authenticated USING (id = auth.uid() OR is_admin());

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid() AND role = 'client');

DROP POLICY IF EXISTS "update_own_or_admin_profiles" ON profiles;
CREATE POLICY "update_own_or_admin_profiles" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid() OR is_admin())
  WITH CHECK (id = auth.uid() OR is_admin());

-- ============================================================
-- bureaus: add ownership + address note
-- ============================================================
ALTER TABLE bureaus ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
ALTER TABLE bureaus ADD COLUMN IF NOT EXISTS address_description text;

CREATE INDEX IF NOT EXISTS idx_bureaus_user_id ON bureaus(user_id);

CREATE OR REPLACE FUNCTION is_bureau_owner(check_bureau_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM bureaus WHERE id = check_bureau_id AND user_id = auth.uid());
$$;

-- an agent's own rate/verification edits on their own bureau shouldn't need
-- admin approval; only an actual admin can (re)verify someone else's bureau
CREATE OR REPLACE FUNCTION protect_bureau_verification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified
     AND NOT is_admin()
     AND NOT (auth.uid() = OLD.user_id) THEN
    NEW.verified := OLD.verified;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_bureau_verification ON bureaus;
CREATE TRIGGER trg_protect_bureau_verification
BEFORE UPDATE ON bureaus
FOR EACH ROW EXECUTE FUNCTION protect_bureau_verification();

-- drop the old single-admin-email policies from the previous migration
DROP POLICY IF EXISTS "admin_update_bureaus" ON bureaus;
DROP POLICY IF EXISTS "admin_delete_bureaus" ON bureaus;
DROP POLICY IF EXISTS "public_insert_unverified_bureaus" ON bureaus;

CREATE POLICY "insert_own_bureau" ON bureaus FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid() AND verified = false);

CREATE POLICY "update_own_or_admin_bureaus" ON bureaus FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR is_admin())
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "delete_own_or_admin_bureaus" ON bureaus FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR is_admin());

-- ============================================================
-- exchange_rates: owner's own updates are auto-verified
-- ============================================================
DROP POLICY IF EXISTS "public_insert_pending_rates" ON exchange_rates;
DROP POLICY IF EXISTS "admin_update_exchange_rates" ON exchange_rates;
DROP POLICY IF EXISTS "admin_delete_exchange_rates" ON exchange_rates;

CREATE POLICY "insert_rate_pending_or_own_bureau" ON exchange_rates FOR INSERT
  TO anon, authenticated WITH CHECK (
    status = 'pending' OR (status = 'verified' AND is_bureau_owner(bureau_id))
  );

CREATE POLICY "update_rate_owner_or_admin" ON exchange_rates FOR UPDATE
  TO authenticated USING (is_bureau_owner(bureau_id) OR is_admin())
  WITH CHECK (is_bureau_owner(bureau_id) OR is_admin());

CREATE POLICY "delete_rate_owner_or_admin" ON exchange_rates FOR DELETE
  TO authenticated USING (is_bureau_owner(bureau_id) OR is_admin());

-- ============================================================
-- local_vendors
-- ============================================================
CREATE TABLE IF NOT EXISTS local_vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bureau_id uuid NOT NULL REFERENCES bureaus(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  products_summary text,
  photo_url text,
  is_active boolean NOT NULL DEFAULT true,
  latitude double precision,
  longitude double precision,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_local_vendors_bureau_id ON local_vendors(bureau_id);

CREATE OR REPLACE FUNCTION is_vendor_owner(check_vendor_id uuid)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM local_vendors v
    JOIN bureaus b ON b.id = v.bureau_id
    WHERE v.id = check_vendor_id AND b.user_id = auth.uid()
  );
$$;

ALTER TABLE local_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_select_local_vendors" ON local_vendors FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_local_vendor_by_bureau_owner" ON local_vendors FOR INSERT
  TO authenticated WITH CHECK (is_bureau_owner(bureau_id));

CREATE POLICY "update_local_vendor_owner_or_admin" ON local_vendors FOR UPDATE
  TO authenticated USING (is_vendor_owner(id) OR is_admin())
  WITH CHECK (is_bureau_owner(bureau_id) OR is_admin());

CREATE POLICY "delete_local_vendor_owner_or_admin" ON local_vendors FOR DELETE
  TO authenticated USING (is_vendor_owner(id) OR is_admin());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'local_vendors'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE local_vendors;
  END IF;
END $$;

/*
## Manual one-time step (cannot be done from the app, by design)
After you sign up for the first time, make yourself admin:

  UPDATE profiles SET role = 'admin'
  WHERE id = (SELECT id FROM auth.users WHERE email = 'votre-email@exemple.com');
*/
