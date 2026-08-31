-- ==========================================
-- SOLOSPIDER.AI - BACKLINKS MODULE DATABASE SCHEMA
-- Execute in Supabase Dashboard SQL Editor
-- ==========================================

create extension if not exists pgcrypto;

-- 1. Backlink Projects Table
create table if not exists public.backlink_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  website text not null,
  name text not null,
  industry text,
  target_keywords text[] default '{}'::text[],
  promotable_pages jsonb default '[]'::jsonb,
  gsc_connected boolean default false,
  gsc_site_url text,
  settings jsonb default '{"auto_pilot": false, "default_sending_delay_minutes": 15}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Discovered Prospects Table
create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  backlink_project_id uuid not null references public.backlink_projects(id) on delete cascade,
  website text not null,
  domain text not null,
  category text default 'Blog', -- Blog, Listicles, SaaS Directory, Resource Page, Review, News, Podcast
  relevance_score integer default 50, -- 0 to 100
  score_explanation text,
  estimated_authority integer default 30, -- 0 to 100 (Estimated)
  estimated_traffic integer default 1000, -- Estimated monthly visits
  spam_risk text default 'Low', -- Low, Medium, High
  country text default 'United States',
  language text default 'English',
  contact_page_url text,
  social_links jsonb default '{}'::jsonb,
  status text not null default 'discovered', -- discovered, qualified, contacting, converted, rejected, blacklisted
  created_at timestamptz not null default now()
);

-- 3. Prospect AI Analysis Table
create table if not exists public.prospect_analysis (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  writing_style text,
  audience text,
  content_quality text,
  avg_article_length integer,
  linking_behaviour text,
  best_outreach_angle text,
  best_page_to_promote text,
  suggested_anchor_text text,
  raw_ai_analysis jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 4. Contacts Table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  name text,
  role text, -- Founder, Editor, SEO Manager, Marketing Manager, Author
  email text,
  linkedin text,
  twitter text,
  source text default 'Crawl', -- Crawl, GSC, Enrichment
  is_verified boolean default false,
  verification_status text default 'unverified', -- verified, unverified, invalid
  created_at timestamptz not null default now()
);

-- 5. Outreach Campaigns Table
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  backlink_project_id uuid not null references public.backlink_projects(id) on delete cascade,
  name text not null,
  target_page_url text not null,
  status text not null default 'draft', -- draft, active, paused, completed
  total_prospects integer default 0,
  emails_sent integer default 0,
  emails_opened integer default 0,
  replies_count integer default 0,
  positive_replies integer default 0,
  backlinks_earned integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Campaign Messages Table (Sequence: Email 1, Follow-up 1, Follow-up 2, Final)
create table if not exists public.campaign_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  step_number integer not null default 1, -- 1: Initial, 2: Followup 1 (4d), 3: Followup 2 (7d), 4: Final (14d)
  subject text not null,
  body_text text not null,
  status text not null default 'queued', -- queued, sent, failed, cancelled
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- 7. Campaign Replies Table
create table if not exists public.campaign_replies (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  sender_email text not null,
  subject text,
  message_body text not null,
  sentiment text default 'question', -- positive, negative, question, negotiation
  ai_summary text,
  ai_suggested_reply text,
  is_read boolean default false,
  replied_by_user boolean default false,
  created_at timestamptz not null default now()
);

-- 8. Verified Live Backlinks Table
create table if not exists public.verified_backlinks (
  id uuid primary key default gen_random_uuid(),
  backlink_project_id uuid not null references public.backlink_projects(id) on delete cascade,
  prospect_id uuid references public.prospects(id) on delete set null,
  referring_url text not null,
  target_url text not null,
  anchor_text text,
  rel_type text default 'dofollow', -- dofollow, nofollow, ugc, sponsored
  status_code integer default 200,
  canonical_url text,
  is_active boolean default true,
  first_seen timestamptz default now(),
  last_seen timestamptz default now()
);

-- 9. Lost Backlinks Table
create table if not exists public.lost_backlinks (
  id uuid primary key default gen_random_uuid(),
  backlink_project_id uuid not null references public.backlink_projects(id) on delete cascade,
  verified_backlink_id uuid references public.verified_backlinks(id) on delete cascade,
  referring_url text not null,
  target_url text not null,
  reason text not null, -- 404, removed, nofollow_added, noindex, redirect
  detected_at timestamptz not null default now()
);

-- 10. Link Checks Audit Log Table
create table if not exists public.link_checks (
  id uuid primary key default gen_random_uuid(),
  verified_backlink_id uuid not null references public.verified_backlinks(id) on delete cascade,
  status text not null, -- success, missing, error
  status_code integer,
  error_message text,
  checked_at timestamptz not null default now()
);

-- 11. Backlinks Notifications Table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- backlink_earned, backlink_lost, new_positive_reply, campaign_completed
  title text not null,
  message text not null,
  is_read boolean default false,
  created_at timestamptz not null default now()
);

-- 12. AI Summaries Cache Table
create table if not exists public.ai_summaries (
  id uuid primary key default gen_random_uuid(),
  target_id uuid not null, -- prospect_id or thread_id
  type text not null, -- prospect_summary, email_thread_summary, strategy_recommendation
  content text not null,
  created_at timestamptz not null default now()
);

-- 13. Email Events Table
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  campaign_message_id uuid not null references public.campaign_messages(id) on delete cascade,
  event_type text not null, -- sent, delivered, opened, clicked, replied, bounced
  timestamp timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_prospects_project on public.prospects(backlink_project_id);
create index if not exists idx_contacts_prospect on public.contacts(prospect_id);
create index if not exists idx_campaigns_project on public.campaigns(backlink_project_id);
create index if not exists idx_messages_campaign on public.campaign_messages(campaign_id);
create index if not exists idx_replies_campaign on public.campaign_replies(campaign_id);
create index if not exists idx_verified_links_project on public.verified_backlinks(backlink_project_id);
create index if not exists idx_lost_links_project on public.lost_backlinks(backlink_project_id);

-- Enable RLS & Add Full Access Policies for all Backlinks Tables
alter table public.backlink_projects enable row level security;
alter table public.prospects enable row level security;
alter table public.prospect_analysis enable row level security;
alter table public.contacts enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_messages enable row level security;
alter table public.campaign_replies enable row level security;
alter table public.verified_backlinks enable row level security;
alter table public.lost_backlinks enable row level security;
alter table public.link_checks enable row level security;
alter table public.notifications enable row level security;
alter table public.ai_summaries enable row level security;
alter table public.email_events enable row level security;

drop policy if exists "Enable all actions on backlink_projects" on public.backlink_projects;
create policy "Enable all actions on backlink_projects" on public.backlink_projects for all using (true) with check (true);

drop policy if exists "Enable all actions on prospects" on public.prospects;
create policy "Enable all actions on prospects" on public.prospects for all using (true) with check (true);

drop policy if exists "Enable all actions on prospect_analysis" on public.prospect_analysis;
create policy "Enable all actions on prospect_analysis" on public.prospect_analysis for all using (true) with check (true);

drop policy if exists "Enable all actions on contacts" on public.contacts;
create policy "Enable all actions on contacts" on public.contacts for all using (true) with check (true);

drop policy if exists "Enable all actions on campaigns" on public.campaigns;
create policy "Enable all actions on campaigns" on public.campaigns for all using (true) with check (true);

drop policy if exists "Enable all actions on campaign_messages" on public.campaign_messages;
create policy "Enable all actions on campaign_messages" on public.campaign_messages for all using (true) with check (true);

drop policy if exists "Enable all actions on campaign_replies" on public.campaign_replies;
create policy "Enable all actions on campaign_replies" on public.campaign_replies for all using (true) with check (true);

drop policy if exists "Enable all actions on verified_backlinks" on public.verified_backlinks;
create policy "Enable all actions on verified_backlinks" on public.verified_backlinks for all using (true) with check (true);

drop policy if exists "Enable all actions on lost_backlinks" on public.lost_backlinks;
create policy "Enable all actions on lost_backlinks" on public.lost_backlinks for all using (true) with check (true);

drop policy if exists "Enable all actions on link_checks" on public.link_checks;
create policy "Enable all actions on link_checks" on public.link_checks for all using (true) with check (true);

drop policy if exists "Enable all actions on notifications" on public.notifications;
create policy "Enable all actions on notifications" on public.notifications for all using (true) with check (true);

drop policy if exists "Enable all actions on ai_summaries" on public.ai_summaries;
create policy "Enable all actions on ai_summaries" on public.ai_summaries for all using (true) with check (true);

drop policy if exists "Enable all actions on email_events" on public.email_events;
create policy "Enable all actions on email_events" on public.email_events for all using (true) with check (true);
