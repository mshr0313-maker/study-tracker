-- ============================================================
-- 学習きろく スキーマ
-- Supabase ダッシュボード → SQL Editor に貼り付けて実行
-- ============================================================

create table if not exists children (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz default now()
);

create table if not exists records (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references children(id) on delete cascade,
  subject      text not null,
  content      text not null,
  memo         text,
  start_time   text,
  end_time     text,
  duration_min integer default 0,
  recorded_at  timestamptz default now()
);

-- photos: deleted_at が入ったら「削除済み」扱い、path は null になる
create table if not exists photos (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references records(id) on delete cascade,
  path       text,                      -- 削除後は null
  deleted_at timestamptz default null,  -- 削除された日時
  created_at timestamptz default now()
);

create table if not exists comments (
  id         uuid primary key default gen_random_uuid(),
  record_id  uuid not null references records(id) on delete cascade,
  author     text not null,
  body       text not null,
  created_at timestamptz default now()
);

create index if not exists idx_records_child    on records(child_id);
create index if not exists idx_records_recorded on records(recorded_at desc);
create index if not exists idx_photos_record    on photos(record_id);
create index if not exists idx_comments_record  on comments(record_id);

-- Storage バケット
insert into storage.buckets (id, name, public)
values ('study-photos', 'study-photos', true)
on conflict do nothing;

-- Storage ポリシー
drop policy if exists "allow_read"   on storage.objects;
drop policy if exists "allow_insert" on storage.objects;
drop policy if exists "allow_delete" on storage.objects;
create policy "allow_read"   on storage.objects for select using (bucket_id = 'study-photos');
create policy "allow_insert" on storage.objects for insert with check (bucket_id = 'study-photos');
create policy "allow_delete" on storage.objects for delete using (bucket_id = 'study-photos');

-- RLS 無効（家族内アプリ）
alter table children disable row level security;
alter table records  disable row level security;
alter table photos   disable row level security;
alter table comments disable row level security;
