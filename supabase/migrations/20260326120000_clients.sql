-- Clients et notes de séance (tableau de bord). Exécuter dans Supabase SQL Editor ou via CLI.

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  nom text not null default '',
  prenom text not null default '',
  email text not null default '',
  telephone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.client_seance_notes (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  content text not null,
  seance_date timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists client_seance_notes_client_id_idx
  on public.client_seance_notes (client_id);

create or replace function public.set_clients_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists clients_updated_at on public.clients;
create trigger clients_updated_at
  before update on public.clients
  for each row
  execute function public.set_clients_updated_at();

alter table public.clients enable row level security;
alter table public.client_seance_notes enable row level security;

drop policy if exists "clients_admin_all" on public.clients;
create policy "clients_admin_all"
  on public.clients
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.admins a
      where a.email = (auth.jwt()->>'email')
    )
  )
  with check (
    exists (
      select 1
      from public.admins a
      where a.email = (auth.jwt()->>'email')
    )
  );

drop policy if exists "client_seance_notes_admin_all" on public.client_seance_notes;
create policy "client_seance_notes_admin_all"
  on public.client_seance_notes
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.admins a
      where a.email = (auth.jwt()->>'email')
    )
  )
  with check (
    exists (
      select 1
      from public.admins a
      where a.email = (auth.jwt()->>'email')
    )
  );
