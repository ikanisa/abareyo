set search_path = public;

-- === ENUMS ================================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'match_status') THEN
    CREATE TYPE match_status AS ENUM ('upcoming','live','ft');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_zone') THEN
    CREATE TYPE ticket_zone AS ENUM ('VIP','Regular','Blue');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_pass_state') THEN
    CREATE TYPE ticket_pass_state AS ENUM ('active','used','refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ticket_order_status') THEN
    CREATE TYPE ticket_order_status AS ENUM ('pending','paid','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    CREATE TYPE order_status AS ENUM ('pending','paid','ready','pickedup');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_status') THEN
    CREATE TYPE insurance_status AS ENUM ('quoted','paid','issued');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'sacco_status') THEN
    CREATE TYPE sacco_status AS ENUM ('pending','confirmed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_kind') THEN
    CREATE TYPE payment_kind AS ENUM ('ticket','shop','deposit','policy');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending','confirmed','failed');
  END IF;
END $$;

-- === MATCHES ==============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'date'
  ) THEN
    ALTER TABLE matches RENAME COLUMN date TO kickoff;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'title'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'matches' AND column_name = 'opponent'
  ) THEN
    ALTER TABLE matches ADD COLUMN opponent text;
    UPDATE matches SET opponent = title WHERE opponent IS NULL;
  END IF;
END $$;

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS opponent text,
  ADD COLUMN IF NOT EXISTS kickoff timestamptz,
  ADD COLUMN IF NOT EXISTS venue text,
  ADD COLUMN IF NOT EXISTS status match_status NOT NULL DEFAULT 'upcoming',
  ADD COLUMN IF NOT EXISTS vip_price int,
  ADD COLUMN IF NOT EXISTS regular_price int,
  ADD COLUMN IF NOT EXISTS seats_vip int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seats_regular int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seats_blue int DEFAULT 0;

UPDATE matches
SET kickoff = NOW()
WHERE kickoff IS NULL;

-- Normalize historical columns once data copied.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='matches' AND column_name='title'
  ) THEN
    ALTER TABLE matches DROP COLUMN title;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='matches' AND column_name='comp'
  ) THEN
    ALTER TABLE matches DROP COLUMN comp;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='matches' AND column_name='home_team'
  ) THEN
    ALTER TABLE matches DROP COLUMN home_team;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='matches' AND column_name='away_team'
  ) THEN
    ALTER TABLE matches DROP COLUMN away_team;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS match_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity int NOT NULL DEFAULT 0,
  price int NOT NULL DEFAULT 0,
  default_gate text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS match_gates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  name text NOT NULL,
  location text,
  max_throughput int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- === TICKETS ==============================================================
ALTER TABLE ticket_orders
  ALTER COLUMN status TYPE ticket_order_status USING status::ticket_order_status,
  ADD COLUMN IF NOT EXISTS sms_ref text,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS ussd_code text;

CREATE TABLE IF NOT EXISTS ticket_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES ticket_orders(id) ON DELETE CASCADE,
  zone ticket_zone NOT NULL,
  gate text,
  qr_token_hash text,
  state ticket_pass_state NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- migrate legacy tickets table if present
DO $$
DECLARE
  has_tickets boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='tickets'
  ) INTO has_tickets;
  IF has_tickets THEN
    INSERT INTO ticket_passes (id, order_id, zone, gate, qr_token_hash, state, created_at)
    SELECT
      id,
      order_id,
      COALESCE(zone::text, 'Blue')::ticket_zone,
      gate,
      COALESCE(qr_token, momo_ref),
      CASE
        WHEN state IS NOT NULL THEN state::ticket_pass_state
        WHEN paid IS TRUE THEN 'active'::ticket_pass_state
        ELSE 'active'::ticket_pass_state
      END,
      created_at
    FROM tickets
    ON CONFLICT (id) DO NOTHING;
    ALTER TABLE tickets RENAME TO tickets_legacy;
  END IF;
END $$;

-- === ORDERS & SHOP ========================================================
ALTER TABLE orders
  ALTER COLUMN status TYPE order_status USING status::order_status,
  ADD COLUMN IF NOT EXISTS momo_ref text;

CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text CHECK (category IN ('jerseys','training','lifestyle','accessories','kids','bundles')),
  price int NOT NULL,
  stock int DEFAULT 0,
  description text,
  images jsonb DEFAULT '[]'::jsonb,
  badge text
);

DO $$
DECLARE
  has_products boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='products'
  ) INTO has_products;
  IF has_products THEN
    INSERT INTO shop_products (id, name, price, stock, images)
    SELECT id, name, price, stock, COALESCE(images, '[]'::jsonb)
    FROM products
    ON CONFLICT (id) DO NOTHING;
    ALTER TABLE products RENAME TO products_legacy;
  END IF;
END $$;

-- Ensure order_items references shop_products
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='order_items' AND column_name='product_id'
  ) THEN
    ALTER TABLE order_items
      DROP CONSTRAINT IF EXISTS order_items_product_id_fkey,
      ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES shop_products(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- === PAYMENTS =============================================================
UPDATE payments SET kind = 'shop' WHERE kind IN ('purchase', 'membership');
UPDATE payments SET kind = 'ticket' WHERE kind NOT IN ('shop', 'deposit', 'policy') AND kind IS NOT NULL;

ALTER TABLE payments
  ALTER COLUMN kind TYPE payment_kind USING kind::payment_kind,
  ALTER COLUMN status TYPE payment_status USING status::payment_status,
  ADD COLUMN IF NOT EXISTS ticket_order_id uuid,
  ADD COLUMN IF NOT EXISTS order_id uuid,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS payments_order_id_fkey,
  ADD CONSTRAINT payments_ticket_order_id_fkey FOREIGN KEY (ticket_order_id) REFERENCES ticket_orders(id) ON DELETE SET NULL,
  ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

DO $$
DECLARE
  has_transactions boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='transactions'
  ) INTO has_transactions;
  IF has_transactions THEN
    INSERT INTO payments (id, kind, amount, status, ticket_order_id, created_at, metadata)
    SELECT
      id,
      CASE
        WHEN kind = 'purchase' THEN 'shop'::payment_kind
        WHEN kind = 'deposit' THEN 'deposit'::payment_kind
        ELSE 'ticket'::payment_kind
      END,
      amount,
      COALESCE(status, 'pending')::payment_status,
      NULL,
      created_at,
      jsonb_build_object('legacy_ref', ref, 'legacy_user_id', user_id)
    FROM transactions
    ON CONFLICT (id) DO NOTHING;
    ALTER TABLE transactions RENAME TO transactions_legacy;
  END IF;
END $$;

-- === REWARDS TRIGGER ======================================================
CREATE OR REPLACE FUNCTION rewards_points_for(kind text, amount int)
RETURNS int LANGUAGE plpgsql AS $$
BEGIN
  IF kind = 'deposit' THEN
    RETURN GREATEST(1, ROUND(amount * 0.02));
  ELSIF kind = 'shop' THEN
    RETURN GREATEST(1, ROUND(amount * 0.01));
  ELSE
    RETURN 0;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION award_points_on_transaction()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
  add_points int := rewards_points_for(NEW.kind, NEW.amount);
  owning_user uuid;
BEGIN
  IF add_points > 0 THEN
    IF NEW.ticket_order_id IS NOT NULL THEN
      SELECT user_id INTO owning_user FROM ticket_orders WHERE id = NEW.ticket_order_id;
    ELSIF NEW.order_id IS NOT NULL THEN
      SELECT user_id INTO owning_user FROM orders WHERE id = NEW.order_id;
    END IF;
    IF owning_user IS NOT NULL THEN
      UPDATE users SET points = COALESCE(points,0) + add_points WHERE id = owning_user;
      INSERT INTO rewards_events (user_id, source, ref_id, points, meta)
      VALUES (owning_user, 'transaction', NEW.id, add_points, jsonb_build_object('kind', NEW.kind, 'amount', NEW.amount));
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_rewards_on_transactions ON payments;
CREATE TRIGGER trg_rewards_on_transactions
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION award_points_on_transaction();

-- === ADMIN / RBAC =========================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  display_name text,
  status text NOT NULL DEFAULT 'active',
  last_login timestamptz
);

CREATE TABLE IF NOT EXISTS admin_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_users_roles (
  admin_user_id uuid REFERENCES admin_users(id) ON DELETE CASCADE,
  role_id uuid REFERENCES admin_roles(id) ON DELETE CASCADE,
  PRIMARY KEY (admin_user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS roles_permissions (
  role_id uuid REFERENCES admin_roles(id) ON DELETE CASCADE,
  permission_id uuid REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked boolean NOT NULL DEFAULT false,
  last_seen_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at timestamptz NOT NULL DEFAULT now(),
  admin_user_id uuid REFERENCES admin_users(id),
  action text NOT NULL,
  entity_type text,
  entity_id text,
  before jsonb,
  after jsonb,
  ip text,
  ua text
);

CREATE TABLE IF NOT EXISTS feature_flags (
  key text PRIMARY KEY,
  value jsonb,
  updated_by uuid REFERENCES admin_users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS translations (
  lang text NOT NULL,
  key text NOT NULL,
  value text NOT NULL,
  updated_by uuid REFERENCES admin_users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (lang, key)
);

-- Seed default permissions when empty
INSERT INTO permissions (key, description)
SELECT key, description
FROM (VALUES
  ('match.manage', 'Create and update match operations data'),
  ('orders.read', 'View ticket and shop orders'),
  ('orders.refund', 'Refund ticket and shop orders'),
  ('shop.manage', 'Manage shop catalog and orders'),
  ('sms.attach', 'Attach inbound SMS to payments'),
  ('admin.manage', 'Manage admin users and roles')
) AS perms(key, description)
ON CONFLICT (key) DO NOTHING;

