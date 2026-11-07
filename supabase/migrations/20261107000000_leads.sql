-- Leads from the dronewash website and landing page.
create table if not exists public.leads (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 2 and 80),
  phone text not null check (char_length(phone) between 9 and 15),
  address text not null check (char_length(address) between 4 and 160),
  source text not null default 'unknown' check (source in ('website', 'landing', 'unknown')),
  page text,
  referrer text,
  utm jsonb not null default '{}'::jsonb,
  ip_hash text,
  user_agent text,
  deploy_context text,
  status text not null default 'new' check (status in ('new', 'contacted', 'closed', 'spam', 'test'))
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_ip_hash_created_idx on public.leads (ip_hash, created_at);

-- RLS on, no policies: the browser (anon key) cannot read or write.
-- Only the server function, using the service role key, can insert.
alter table public.leads enable row level security;
revoke all on public.leads from anon, authenticated;
