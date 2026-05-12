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
  name             text        not null,
  members          text        default '',
  shark_tank_theme text,
  shark_tank_task  text,
  locked           boolean     not null default false,
  created_at       timestamptz default now()
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
-- SUBTASKS (oppgaver)
-- Some activities are broken into sub-tasks, each with their own max score.
-- e.g. "Logistikkolympics" might have 3 oppgaver worth 10, 3 and 4 points.
-- all_or_nothing = true means only 0 or max_points is valid (toggle scoring).
-- Activities without subtask rows use flat scoring as before.
-- -----------------------------------------------------------------------------
create table if not exists subtasks (
  id             uuid        default gen_random_uuid() primary key,
  activity_id    uuid        references activities(id) on delete cascade not null,
  name           text        not null,
  max_points     integer     not null check (max_points > 0),
  sort_order     integer     not null default 0,
  all_or_nothing boolean     not null default false
);

-- -----------------------------------------------------------------------------
-- SCORES
-- Each row records points awarded to a team.
-- If subtask_id is set, the score belongs to a specific subtask of an activity.
-- The unique index ensures one score per team per subtask (upsert pattern).
-- If subtask_id is null, it's a flat score for an activity without subtasks.
-- -----------------------------------------------------------------------------
create table if not exists scores (
  id          uuid        default gen_random_uuid() primary key,
  team_id     uuid        references teams(id)      on delete cascade not null,
  activity_id uuid        references activities(id) on delete cascade not null,
  subtask_id  uuid        references subtasks(id)   on delete cascade,
  points      integer     not null check (points >= 0),
  created_at  timestamptz default now()
);

-- One score per team per subtask (only for rows that have a subtask)
create unique index if not exists scores_team_subtask_uniq
  on scores (team_id, subtask_id) where subtask_id is not null;


-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- RLS must be enabled before policies take effect. Without any policies,
-- no one can access the table even with a valid API key.
-- -----------------------------------------------------------------------------
alter table teams      enable row level security;
alter table activities enable row level security;
alter table subtasks   enable row level security;
alter table scores     enable row level security;

-- Allow full access to all three tables for anyone with the anon key.
-- In a production app you would restrict this to authenticated users only.
create policy "Public read/write on teams"
  on teams for all using (true) with check (true);

create policy "Public read/write on activities"
  on activities for all using (true) with check (true);

create policy "Public read/write on subtasks"
  on subtasks for all using (true) with check (true);

create policy "Public read/write on scores"
  on scores for all using (true) with check (true);


-- -----------------------------------------------------------------------------
-- MARIO KART MATCHES
-- Tracks bonus Mario Kart matches between teams. Each team pair can play once.
-- Flow: team_a challenges team_b → they play → either team reports the winner
-- → the other team confirms → 2 points awarded to the winner.
-- -----------------------------------------------------------------------------
create table if not exists mario_kart_matches (
  id              uuid        default gen_random_uuid() primary key,
  team_a_id       uuid        references teams(id) on delete cascade not null,
  team_b_id       uuid        references teams(id) on delete cascade not null,
  winner_team_id  uuid        references teams(id) on delete cascade,
  reported_by     uuid        references teams(id) on delete cascade,
  confirmed       boolean     default false,
  created_at      timestamptz default now(),
  confirmed_at    timestamptz,
  unique (team_a_id, team_b_id)
);

alter table mario_kart_matches enable row level security;

create policy "Public read/write on mario_kart_matches"
  on mario_kart_matches for all using (true) with check (true);


-- -----------------------------------------------------------------------------
-- REAL-TIME
-- Supabase uses PostgreSQL's built-in LISTEN/NOTIFY feature to detect row
-- changes, then forwards them to connected clients over WebSockets.
-- You must enable real-time for each table in the Supabase dashboard:
--   Dashboard → Database → Replication → supabase_realtime → add "scores"
--   and "mario_kart_matches"
-- (teams and activities don't need real-time since the scoreboard only
--  re-fetches them when a score change arrives)
-- -----------------------------------------------------------------------------
