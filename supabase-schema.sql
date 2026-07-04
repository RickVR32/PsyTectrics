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
