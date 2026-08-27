/*
# Add coordinates for geolocation, distance sorting, and the map view

Both cabins and vendors gain nullable latitude/longitude columns. Existing
rows will have them null until the operator sets them (via the "use my
location" button added to the cabin and vendor forms). No RLS changes are
needed — these are plain columns on tables whose read/write policies
already exist (public read, operator-only write).
*/

ALTER TABLE cabins ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE cabins ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS latitude double precision;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS longitude double precision;
