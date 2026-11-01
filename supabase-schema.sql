-- Run this in Supabase: Project → SQL Editor → New query → paste → Run

create table solo_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  -- contact
  email text not null,
  name text,
  marketing_opt_in boolean default true,

  -- intro context fields
  age_band text,
  context text,
  most_like_self text,
  least_like_self text,

  -- raw answers: { "sc1": 4, "sc2": 3, ... } keyed by node id
  answers jsonb not null,

  -- computed results (so you can review without recalculating)
  narc_pct int,
  sist_pct int,
  yarc_pct int,
  oll_pct int,
  awareness_level int,
  awareness_index numeric,
  drift numeric,
  encoded_code text,

  -- payment tracking
  paid boolean default false,
  stripe_session_id text,

  -- for manual report workflow with friends
  report_sent boolean default false,
  notes text
);

create index idx_solo_submissions_email on solo_submissions(email);
create index idx_solo_submissions_stripe_session on solo_submissions(stripe_session_id);
create index idx_solo_submissions_created on solo_submissions(created_at desc);

-- ─────────────────────────────────────────────────────────────
-- Observer / Business report requests (added with server-side checkout)
-- Run this block once in the SQL Editor if solo_submissions already exists.
-- ─────────────────────────────────────────────────────────────
create table if not exists report_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  report_type text not null,          -- 'observer' | 'business'
  scope text,                         -- business tier: '1' | '2-5' | '6-10'
  name text,
  contact text,
  fields jsonb not null,              -- everything from the form
  paid boolean default false,
  stripe_session_id text,
  report_sent boolean default false,
  notes text
);

create index if not exists idx_report_requests_created on report_requests(created_at desc);
create index if not exists idx_report_requests_stripe_session on report_requests(stripe_session_id);

-- Row Level Security: lock both tables to the public (anon) key.
-- The Vercel functions use the service key, which bypasses RLS, so nothing breaks.
alter table solo_submissions enable row level security;
alter table report_requests enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Free test results (Quick Check, Narc Pattern Self-Check, ...)
-- Only saved when the visitor asks for their result by email.
-- ─────────────────────────────────────────────────────────────
create table if not exists test_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  test text not null,
  email text not null,
  marketing_opt_in boolean default false,
  answers jsonb not null,
  result jsonb not null
);
create index if not exists idx_test_results_created on test_results(created_at desc);
alter table test_results enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Awareness Profile v4 — automated reports
-- ─────────────────────────────────────────────────────────────
create table if not exists profile_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  email text not null,
  name text,
  test text not null default 'awareness-profile',
  answers jsonb not null,
  source_code text,
  level int,
  profile_type text,
  marketing_opt_in boolean default false,
  paid boolean default false,
  stripe_session_id text
);
create index if not exists idx_profile_reports_email on profile_reports(email);
create index if not exists idx_profile_reports_session on profile_reports(stripe_session_id);
alter table profile_reports enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Telegram bot users (tests by tap, Q&A limits, monthly check-ins)
-- ─────────────────────────────────────────────────────────────
create table if not exists tg_users (
  chat_id text primary key,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  first_name text,
  consent boolean default false,
  checkins boolean default false,
  test text,
  idx int default 0,
  answers jsonb default '[]'::jsonb,
  state text,
  review_rating int,
  last_check timestamptz,
  last_level int,
  last_nudge timestamptz,
  qa_day date,
  qa_count int default 0
);
alter table tg_users enable row level security;

-- ─────────────────────────────────────────────────────────────
-- Reviews — shown on the site only after Rick approves in Telegram
-- ─────────────────────────────────────────────────────────────
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  rating int not null check (rating between 1 and 5),
  text text not null,
  product text default 'Awareness Profile',
  incentivised boolean default false,
  source text default 'site',
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at timestamptz
);
create index if not exists idx_reviews_status on reviews(status, created_at desc);
alter table reviews enable row level security;
