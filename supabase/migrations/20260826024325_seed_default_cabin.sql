/*
# Seed a default cabin

The schema migration creates the `cabins` and `vendors` tables but inserts
no rows. The app reads the first cabin with `.limit(1).maybeSingle()`, so
without a seed row every visitor sees "Aucune cabine configurée" and the
admin dashboard has no rates form to open.

This migration inserts one starter cabin, only if the table is empty, so it
is safe to re-run and won't duplicate rows if a cabin already exists.
*/

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
