-- Eternity Tech Consulting - Knowledge Hub
-- Run this entire script in Supabase > SQL Editor > New query.

create extension if not exists pgcrypto;

create table if not exists public.knowledge_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author text not null check (char_length(trim(author)) between 1 and 60),
  title text not null check (char_length(trim(title)) between 1 and 150),
  content_html text not null check (char_length(content_html) between 1 and 50000),
  image_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author text not null check (char_length(trim(author)) between 1 and 60),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists comments_post_created_idx on public.comments (post_id, created_at asc);

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.knowledge_admins enable row level security;

-- Public visitors can read articles and comments.
drop policy if exists "Anyone can read posts" on public.posts;
create policy "Anyone can read posts" on public.posts for select to anon, authenticated using (true);

drop policy if exists "Anyone can publish posts" on public.posts;
create policy "Anyone can publish posts" on public.posts for insert to anon, authenticated
with check (
  char_length(trim(author)) between 1 and 60 and
  char_length(trim(title)) between 1 and 150 and
  char_length(content_html) between 1 and 50000
);

-- Only signed-in users listed in knowledge_admins can delete posts.
drop policy if exists "Admins can delete posts" on public.posts;
create policy "Admins can delete posts" on public.posts for delete to authenticated
using (exists (select 1 from public.knowledge_admins a where a.user_id = auth.uid()));

-- Public visitors can read and add comments.
drop policy if exists "Anyone can read comments" on public.comments;
create policy "Anyone can read comments" on public.comments for select to anon, authenticated using (true);

drop policy if exists "Anyone can add comments" on public.comments;
create policy "Anyone can add comments" on public.comments for insert to anon, authenticated
with check (
  char_length(trim(author)) between 1 and 60 and
  char_length(trim(body)) between 1 and 2000 and
  exists (select 1 from public.posts p where p.id = post_id)
);

-- Only admins can delete comments. Post deletion also cascades to its comments.
drop policy if exists "Admins can delete comments" on public.comments;
create policy "Admins can delete comments" on public.comments for delete to authenticated
using (exists (select 1 from public.knowledge_admins a where a.user_id = auth.uid()));

-- Admins can check their own admin status; visitors cannot enumerate admins.
drop policy if exists "Admins can read own admin record" on public.knowledge_admins;
create policy "Admins can read own admin record" on public.knowledge_admins for select to authenticated
using (user_id = auth.uid());

-- Storage bucket for article images (public read, public upload, admin-only delete).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('knowledge-images', 'knowledge-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "Public can view knowledge images" on storage.objects;
create policy "Public can view knowledge images" on storage.objects for select to anon, authenticated
using (bucket_id = 'knowledge-images');

drop policy if exists "Public can upload knowledge images" on storage.objects;
create policy "Public can upload knowledge images" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'knowledge-images');

drop policy if exists "Admins can delete knowledge images" on storage.objects;
create policy "Admins can delete knowledge images" on storage.objects for delete to authenticated
using (
  bucket_id = 'knowledge-images' and
  exists (select 1 from public.knowledge_admins a where a.user_id = auth.uid())
);

-- No public UPDATE policies are created. Public users cannot edit or delete content.
