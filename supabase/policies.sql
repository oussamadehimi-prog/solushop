-- The application uploads through the server-side Next.js API.
-- SUPABASE_SECRET_KEY must remain server-only and bypasses these policies.
-- The SELECT policy is required for public image URLs.

insert into storage.buckets (id, name, public)
values ('image', 'image', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read product images" on storage.objects;
create policy "Public can read product images"
on storage.objects for select
to public
using (bucket_id = 'image');

drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Authenticated users can upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'image'
  and name like 'products/%'
);

drop policy if exists "Authenticated users can update product images" on storage.objects;
create policy "Authenticated users can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'image' and name like 'products/%')
with check (bucket_id = 'image' and name like 'products/%');

drop policy if exists "Authenticated users can delete product images" on storage.objects;
create policy "Authenticated users can delete product images"
on storage.objects for delete
to authenticated
using (bucket_id = 'image' and name like 'products/%');

-- These policies apply only to Supabase client/PostgREST access.
-- Prisma server access is not changed by them.
alter table public."Product" enable row level security;
alter table public."ProductImage" enable row level security;

drop policy if exists "Authenticated users can manage products" on public."Product";
create policy "Authenticated users can manage products"
on public."Product" for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can manage product images" on public."ProductImage";
create policy "Authenticated users can manage product images"
on public."ProductImage" for all
to authenticated
using (true)
with check (true);
