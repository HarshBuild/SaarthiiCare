-- SAARTHII Supabase migration 0006
-- Private storage bucket and Realtime publication.
--
-- Object path convention:
--   <facility_uuid>/<referral_uuid>/<filename>
--
-- The first path segment is the facility id. Policies use it to keep
-- documents scoped to the uploader's facility.

create or replace function public.storage_folder_facility(object_name text)
returns uuid
language plpgsql
stable
as $$
declare
    folder text;
begin
    if object_name is null then
        return null;
    end if;

    folder := (storage.foldername(object_name))[1];

    if folder is not null
       and folder ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then
        return folder::uuid;
    end if;

    return null;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'referral-documents',
    'referral-documents',
    false,
    10485760,
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists referral_documents_select on storage.objects;
create policy referral_documents_select
    on storage.objects
    for select
    to authenticated
    using (
        bucket_id = 'referral-documents'
        and (
            public.is_supervisor_or_admin()
            or public.has_facility_access(public.storage_folder_facility(name))
        )
    );

drop policy if exists referral_documents_insert on storage.objects;
create policy referral_documents_insert
    on storage.objects
    for insert
    to authenticated
    with check (
        bucket_id = 'referral-documents'
        and public.has_facility_access(public.storage_folder_facility(name))
    );

drop policy if exists referral_documents_update on storage.objects;
create policy referral_documents_update
    on storage.objects
    for update
    to authenticated
    using (
        bucket_id = 'referral-documents'
        and (
            public.is_supervisor_or_admin()
            or public.has_facility_access(public.storage_folder_facility(name))
        )
    )
    with check (
        bucket_id = 'referral-documents'
        and (
            public.is_supervisor_or_admin()
            or public.has_facility_access(public.storage_folder_facility(name))
        )
    );

drop policy if exists referral_documents_delete on storage.objects;
create policy referral_documents_delete
    on storage.objects
    for delete
    to authenticated
    using (
        bucket_id = 'referral-documents'
        and (
            public.is_supervisor_or_admin()
            or public.has_facility_access(public.storage_folder_facility(name))
        )
    );

do $$
begin
    if exists (
        select 1
        from pg_publication
        where pubname = 'supabase_realtime'
    ) then
        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'referrals'
        ) then
            execute 'alter publication supabase_realtime add table public.referrals';
        end if;

        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'referral_events'
        ) then
            execute 'alter publication supabase_realtime add table public.referral_events';
        end if;

        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'referral_outcomes'
        ) then
            execute 'alter publication supabase_realtime add table public.referral_outcomes';
        end if;

        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'back_referrals'
        ) then
            execute 'alter publication supabase_realtime add table public.back_referrals';
        end if;

        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'follow_up_tasks'
        ) then
            execute 'alter publication supabase_realtime add table public.follow_up_tasks';
        end if;

        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'notifications'
        ) then
            execute 'alter publication supabase_realtime add table public.notifications';
        end if;

        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'escalations'
        ) then
            execute 'alter publication supabase_realtime add table public.escalations';
        end if;
    end if;
end $$;
