-- =============================================================================
-- supabase/schema.sql — Database schema
--
-- What this file does for the app:
--   Defines the structure of all the data the application stores.
--   Run this SQL once in the Supabase dashboard (SQL editor) to create
--   the tables before you start the app.
--
-- Technically:
--   This is PostgreSQL — a relational database. Data is organised into tables
--   (like spreadsheets) where each row is a record and each column is a field.
--
--   Supabase hosts a PostgreSQL database for you and exposes it over:
--     1. A REST API  → used for normal reads and writes from the app
--     2. A WebSocket → used for real-time subscriptions (live scoreboard)
--
--   UUID (Universally Unique Identifier) — each row gets a random 128-bit ID
--   instead of a sequential number. This is safer when IDs appear in URLs.
--
--   ON DELETE CASCADE — if a team is deleted, all its score entries are
--   automatically deleted too, keeping the database consistent.
--
--   Row Level Security (RLS) — Supabase's way of controlling who can read
--   or write each table. We enable it (best practice) and then add policies
--   that allow all operations, since this app has no user login system.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- TEAMS
-- One row per competing group at the summer party.
-- -----------------------------------------------------------------------------
create table if not exists teams (
  id         uuid        default gen_random_uuid() primary key,
  name       text        not null,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- ACTIVITIES
-- One row per event or challenge where teams can earn points.
-- e.g. "Egg & Spoon Race", "Quiz", "Tug of War"
-- -----------------------------------------------------------------------------
create table if not exists activities (
  id         uuid        default gen_random_uuid() primary key,
  name       text        not null,
  created_at timestamptz default now()
);

-- -----------------------------------------------------------------------------
-- SCORES
-- A log of every point award. Instead of storing a running total per team,
-- we store individual entries and sum them when displaying the scoreboard.
-- This gives us a full audit trail and lets us correct mistakes by deleting
-- a specific entry rather than editing a number.
-- -----------------------------------------------------------------------------
create table if not exists scores (
  id          uuid        default gen_random_uuid() primary key,
  team_id     uuid        references teams(id)      on delete cascade not null,
  activity_id uuid        references activities(id) on delete cascade not null,
  points      integer     not null check (points >= 0),
  created_at  timestamptz default now()
);


-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- RLS must be enabled before policies take effect. Without any policies,
-- no one can access the table even with a valid API key.
-- -----------------------------------------------------------------------------
alter table teams      enable row level security;
alter table activities enable row level security;
alter table scores     enable row level security;

-- Allow full access to all three tables for anyone with the anon key.
-- In a production app you would restrict this to authenticated users only.
create policy "Public read/write on teams"
  on teams for all using (true) with check (true);

create policy "Public read/write on activities"
  on activities for all using (true) with check (true);

create policy "Public read/write on scores"
  on scores for all using (true) with check (true);


-- -----------------------------------------------------------------------------
-- REAL-TIME
-- Supabase uses PostgreSQL's built-in LISTEN/NOTIFY feature to detect row
-- changes, then forwards them to connected clients over WebSockets.
-- You must enable real-time for each table in the Supabase dashboard:
--   Dashboard → Database → Replication → supabase_realtime → add "scores"
-- (teams and activities don't need real-time since the scoreboard only
--  re-fetches them when a score change arrives)
-- -----------------------------------------------------------------------------
