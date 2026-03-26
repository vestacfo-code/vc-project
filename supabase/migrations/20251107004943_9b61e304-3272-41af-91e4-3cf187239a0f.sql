-- Create CRM tables with automatic user tracking

-- Enum types for CRM
create type crm_contact_status as enum ('lead', 'prospect', 'customer', 'inactive');
create type crm_contact_source as enum ('cold_call', 'referral', 'website', 'import', 'other');
create type crm_deal_stage as enum ('prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost');
create type crm_activity_type as enum ('call', 'email', 'meeting', 'note', 'task');
create type crm_activity_status as enum ('scheduled', 'completed', 'cancelled');
create type crm_call_outcome as enum ('connected', 'voicemail', 'no_answer', 'busy', 'wrong_number', 'not_interested', 'callback_requested');
create type crm_call_disposition as enum ('hot', 'warm', 'cold', 'not_qualified');
create type crm_import_status as enum ('processing', 'completed', 'failed');

-- CRM Contacts table
create table public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references auth.users not null default auth.uid(),
  updated_by uuid references auth.users,
  assigned_to uuid references auth.users,
  first_name text,
  last_name text,
  email text,
  phone text,
  company text,
  title text,
  status crm_contact_status default 'lead',
  source crm_contact_source default 'cold_call',
  linkedin_url text,
  website text,
  address jsonb default '{}'::jsonb,
  tags text[] default array[]::text[],
  custom_fields jsonb default '{}'::jsonb,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_contacted_at timestamp with time zone,
  last_contacted_by uuid references auth.users,
  next_follow_up timestamp with time zone
);

-- CRM Deals table
create table public.crm_deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.crm_contacts not null,
  created_by uuid references auth.users not null default auth.uid(),
  updated_by uuid references auth.users,
  title text not null,
  value numeric default 0,
  currency text default 'USD',
  stage crm_deal_stage default 'prospecting',
  probability integer default 50 check (probability >= 0 and probability <= 100),
  expected_close_date date,
  actual_close_date date,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- CRM Activities table
create table public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.crm_contacts not null,
  deal_id uuid references public.crm_deals,
  created_by uuid references auth.users not null default auth.uid(),
  updated_by uuid references auth.users,
  activity_type crm_activity_type not null,
  subject text,
  description text,
  outcome text,
  duration_minutes integer,
  scheduled_at timestamp with time zone,
  completed_at timestamp with time zone,
  status crm_activity_status default 'completed',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- CRM Call Logs table
create table public.crm_call_logs (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.crm_contacts not null,
  caller_id uuid references auth.users not null default auth.uid(),
  caller_name text not null,
  caller_email text not null,
  call_date timestamp with time zone default now(),
  duration_seconds integer,
  outcome crm_call_outcome,
  disposition crm_call_disposition,
  notes text,
  follow_up_date date,
  script_used text,
  created_at timestamp with time zone default now()
);

-- CRM Call Scripts table
create table public.crm_call_scripts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  script_content text not null,
  tags text[] default array[]::text[],
  is_active boolean default true,
  created_by uuid references auth.users not null default auth.uid(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- CRM Import History table
create table public.crm_import_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null default auth.uid(),
  file_name text not null,
  import_date timestamp with time zone default now(),
  total_records integer default 0,
  successful_records integer default 0,
  failed_records integer default 0,
  error_log jsonb default '{}'::jsonb,
  import_type text default 'contacts',
  status crm_import_status default 'processing'
);

-- CRM Audit Log table
create table public.crm_audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  user_email text not null,
  user_name text not null,
  action_type text not null,
  entity_type text not null,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  changes jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone default now()
);

-- CRM User Stats table
create table public.crm_user_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  stat_date date not null default current_date,
  calls_made integer default 0,
  calls_connected integer default 0,
  contacts_created integer default 0,
  deals_created integer default 0,
  deals_closed integer default 0,
  total_deal_value numeric default 0,
  activities_logged integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(user_id, stat_date)
);

-- Indexes for performance
create index idx_crm_contacts_created_by on public.crm_contacts(created_by);
create index idx_crm_contacts_assigned_to on public.crm_contacts(assigned_to);
create index idx_crm_contacts_status on public.crm_contacts(status);
create index idx_crm_contacts_next_follow_up on public.crm_contacts(next_follow_up);
create index idx_crm_call_logs_caller_id on public.crm_call_logs(caller_id);
create index idx_crm_call_logs_contact_id on public.crm_call_logs(contact_id);
create index idx_crm_audit_log_user_id on public.crm_audit_log(user_id);
create index idx_crm_audit_log_entity on public.crm_audit_log(entity_type, entity_id);
create index idx_crm_audit_log_created_at on public.crm_audit_log(created_at desc);

-- Enable RLS on all tables
alter table public.crm_contacts enable row level security;
alter table public.crm_deals enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_call_logs enable row level security;
alter table public.crm_call_scripts enable row level security;
alter table public.crm_import_history enable row level security;
alter table public.crm_audit_log enable row level security;
alter table public.crm_user_stats enable row level security;

-- RLS Policies for crm_contacts
create policy "Admins can view all contacts"
on public.crm_contacts for select
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('admin', 'hr_staff', 'super_admin')
  )
);

create policy "Admins can create contacts"
on public.crm_contacts for insert
to authenticated
with check (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('admin', 'hr_staff', 'super_admin')
  )
);

create policy "Admins can update contacts"
on public.crm_contacts for update
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('admin', 'hr_staff', 'super_admin')
  )
);

create policy "Super admins can delete contacts"
on public.crm_contacts for delete
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = 'super_admin'
  )
);

-- RLS Policies for crm_deals
create policy "Admins can manage all deals"
on public.crm_deals for all
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('admin', 'hr_staff', 'super_admin')
  )
);

-- RLS Policies for crm_activities
create policy "Admins can manage all activities"
on public.crm_activities for all
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('admin', 'hr_staff', 'super_admin')
  )
);

-- RLS Policies for crm_call_logs
create policy "Admins can view all call logs"
on public.crm_call_logs for select
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('admin', 'hr_staff', 'super_admin')
  )
);

create policy "Admins can create call logs"
on public.crm_call_logs for insert
to authenticated
with check (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('admin', 'hr_staff', 'super_admin')
  )
);

-- RLS Policies for crm_call_scripts
create policy "Admins can manage call scripts"
on public.crm_call_scripts for all
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role in ('admin', 'hr_staff', 'super_admin')
  )
);

-- RLS Policies for crm_import_history
create policy "Users can view their own import history"
on public.crm_import_history for select
to authenticated
using (user_id = auth.uid());

create policy "Users can create import history"
on public.crm_import_history for insert
to authenticated
with check (user_id = auth.uid());

-- RLS Policies for crm_audit_log
create policy "Super admins can view audit log"
on public.crm_audit_log for select
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = 'super_admin'
  )
);

create policy "Service role can insert audit logs"
on public.crm_audit_log for insert
to service_role
with check (true);

-- RLS Policies for crm_user_stats
create policy "Users can view their own stats"
on public.crm_user_stats for select
to authenticated
using (user_id = auth.uid());

create policy "Super admins can view all stats"
on public.crm_user_stats for select
to authenticated
using (
  exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
    and role = 'super_admin'
  )
);

-- Trigger: Auto-update updated_by on CRM tables
create or replace function public.crm_update_updated_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_by = auth.uid();
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_crm_contacts_updated_by
before update on public.crm_contacts
for each row execute function public.crm_update_updated_by();

create trigger trg_crm_deals_updated_by
before update on public.crm_deals
for each row execute function public.crm_update_updated_by();

create trigger trg_crm_activities_updated_by
before update on public.crm_activities
for each row execute function public.crm_update_updated_by();

create trigger trg_crm_call_scripts_updated_by
before update on public.crm_call_scripts
for each row execute function public.crm_update_updated_by();

-- Trigger: Auto-populate caller info in call logs
create or replace function public.crm_populate_caller_info()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_profile record;
begin
  select email, full_name into user_profile
  from public.profiles
  where user_id = auth.uid();
  
  new.caller_id = auth.uid();
  new.caller_name = coalesce(user_profile.full_name, user_profile.email, 'Unknown');
  new.caller_email = coalesce(user_profile.email, 'unknown@example.com');
  
  return new;
end;
$$;

create trigger trg_crm_call_logs_caller_info
before insert on public.crm_call_logs
for each row execute function public.crm_populate_caller_info();

-- Trigger: Update last_contacted info on contacts
create or replace function public.crm_update_last_contacted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.crm_contacts
  set 
    last_contacted_at = now(),
    last_contacted_by = auth.uid()
  where id = new.contact_id;
  
  return new;
end;
$$;

create trigger trg_crm_call_logs_update_contact
after insert on public.crm_call_logs
for each row execute function public.crm_update_last_contacted();

-- Trigger: Audit log for all CRM changes
create or replace function public.crm_log_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_profile record;
  action_type_val text;
  changes_val jsonb;
  old_json jsonb;
  new_json jsonb;
begin
  select email, full_name into user_profile
  from public.profiles
  where user_id = auth.uid();
  
  if TG_OP = 'INSERT' then
    action_type_val = 'create';
  elsif TG_OP = 'UPDATE' then
    action_type_val = 'update';
  elsif TG_OP = 'DELETE' then
    action_type_val = 'delete';
  end if;
  
  old_json = to_jsonb(old);
  new_json = to_jsonb(new);
  
  if TG_OP = 'UPDATE' then
    changes_val = jsonb_build_object(
      'changed_fields', (
        select jsonb_object_agg(key, jsonb_build_object('old', old_json -> key, 'new', new_json -> key))
        from jsonb_object_keys(new_json) as key
        where old_json -> key is distinct from new_json -> key
        and key not in ('updated_at', 'updated_by')
      )
    );
  end if;
  
  insert into public.crm_audit_log (
    user_id,
    user_email,
    user_name,
    action_type,
    entity_type,
    entity_id,
    old_data,
    new_data,
    changes
  ) values (
    auth.uid(),
    coalesce(user_profile.email, 'unknown'),
    coalesce(user_profile.full_name, user_profile.email, 'Unknown'),
    action_type_val,
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    case when TG_OP = 'DELETE' then old_json else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then new_json else null end,
    changes_val
  );
  
  return coalesce(new, old);
end;
$$;

create trigger trg_crm_contacts_audit
after insert or update or delete on public.crm_contacts
for each row execute function public.crm_log_audit();

create trigger trg_crm_deals_audit
after insert or update or delete on public.crm_deals
for each row execute function public.crm_log_audit();

create trigger trg_crm_call_logs_audit
after insert or update or delete on public.crm_call_logs
for each row execute function public.crm_log_audit();