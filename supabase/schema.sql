-- Trips table
create table trips (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  created_at timestamptz not null default now(),
  start_date date,
  end_date date
);

-- Items table
create table items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references trips(id) on delete cascade,
  type text not null check (type in ('food', 'activity', 'shop')),
  name text not null,
  notes text,
  links text[] not null default '{}',
  added_by text not null,
  done boolean not null default false,
  created_at timestamptz not null default now(),
  scheduled_date date,
  sort_order integer not null default 0
);

create index trips_code_idx on trips(code);
create index items_trip_id_idx on items(trip_id);

-- RLS: the trip code acts as the access key, so all reads/writes are open
alter table trips enable row level security;
alter table items enable row level security;

create policy "public_trips_select" on trips for select using (true);
create policy "public_trips_insert" on trips for insert with check (true);

create policy "public_items_select" on items for select using (true);
create policy "public_items_insert" on items for insert with check (true);
create policy "public_items_update" on items for update using (true) with check (true);
create policy "public_items_delete" on items for delete using (true);

-- Enable realtime for items
alter publication supabase_realtime add table items;
