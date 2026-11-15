create table public.lite_saved_requests (
 id uuid primary key,
 owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
 created_at timestamptz not null default now(),
 origin text not null check (origin ~ '^[A-Z]{3}$'),
 destination text not null check (destination ~ '^[A-Z]{3}$' and destination <> origin),
 departure_date date not null,
 return_date date,
 trip_type text not null check (trip_type in ('ONE_WAY','ROUND_TRIP')),
 adults smallint not null check (adults between 1 and 9),
 children smallint not null check (children between 0 and 8),
 infants smallint not null check (infants between 0 and 9),
 cabin text not null check (cabin in ('ECONOMY','PREMIUM_ECONOMY','BUSINESS','FIRST')),
 preference text not null check (preference in ('BEST','CHEAPEST','FASTEST','FEWEST_STOPS')),
 selected_id text check (selected_id in ('DEMO-A','DEMO-B','DEMO-C')),
 markup integer not null default 0 check (markup between 0 and 500),
 has_draft boolean not null default false,
 demo_only boolean not null default true check (demo_only),
 check (adults+children<=9 and infants<=adults),
 check ((trip_type='ONE_WAY' and return_date is null) or (trip_type='ROUND_TRIP' and return_date>departure_date)),
 check (not has_draft or selected_id is not null)
);
create index lite_saved_requests_owner_created_idx on public.lite_saved_requests(owner_id,created_at desc,id desc);
alter table public.lite_saved_requests enable row level security;
revoke all on public.lite_saved_requests from anon,authenticated;
grant select,insert,delete on public.lite_saved_requests to authenticated;
create policy lite_saved_read on public.lite_saved_requests for select to authenticated
using (owner_id=(select auth.uid()) and exists(select 1 from public.approval_reviewers r where r.user_id=(select auth.uid()) and r.active));
create policy lite_saved_insert on public.lite_saved_requests for insert to authenticated
with check (owner_id=(select auth.uid()) and exists(select 1 from public.approval_reviewers r where r.user_id=(select auth.uid()) and r.active));
create policy lite_saved_delete on public.lite_saved_requests for delete to authenticated
using (owner_id=(select auth.uid()) and exists(select 1 from public.approval_reviewers r where r.user_id=(select auth.uid()) and r.active));
comment on table public.lite_saved_requests is 'Immutable fictional Lite snapshots. No customer details or approval authority. Reopen refreshes sample results and resets draft review.';

alter table public.lite_saved_requests add constraint lite_saved_roundtrip_return_required check (trip_type <> 'ROUND_TRIP' or return_date is not null);
