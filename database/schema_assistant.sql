-- =============================================================================
-- BizPulse: schema_assistant.sql
-- Tables for the AI Assistant (Asisten Bisnis) chat feature.
-- Run AFTER schema.sql, functions.sql, and rls.sql.
--
-- Read-only assistant: chat sessions/messages are stored per org. Business
-- data itself is NEVER duplicated here; the assistant queries it live.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  owner_id uuid not null references profiles(id) on delete cascade,
  title varchar(150) not null default 'Percakapan Baru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_chat_sessions_org on chat_sessions(org_id, updated_at desc);

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  org_id uuid not null references organizations(id) on delete cascade,
  role text not null check (role in ('USER','ASSISTANT')),
  content text not null,
  tool_trace jsonb not null default '[]',   -- tool names used to answer (transparency)
  created_at timestamptz not null default now()
);
create index idx_chat_messages_session on chat_messages(session_id, created_at);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- Keep session updated_at fresh on every new message (used for session list order).
create or replace function touch_chat_session_updated_at() returns trigger
language plpgsql as $$
begin
  update chat_sessions set updated_at = now() where id = new.session_id;
  return new;
end $$;
create trigger trg_chat_message_touch_session
  after insert on chat_messages
  for each row execute function touch_chat_session_updated_at();

-- ---------------------------------------------------------------------------
-- Grants & RLS (follows the pattern of rls.sql; OWNER-only feature)
-- ---------------------------------------------------------------------------

alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;

grant select, insert, delete on chat_sessions to authenticated;
grant update (title) on chat_sessions to authenticated;
grant select, insert on chat_messages to authenticated;

-- chat_sessions: OWNER of the org only
create policy chat_sessions_select_owner on chat_sessions for select to authenticated
  using (org_id = auth_org_id() and auth_role() = 'OWNER');
create policy chat_sessions_insert_owner on chat_sessions for insert to authenticated
  with check (org_id = auth_org_id() and auth_role() = 'OWNER' and owner_id = auth.uid());
create policy chat_sessions_update_owner on chat_sessions for update to authenticated
  using (org_id = auth_org_id() and auth_role() = 'OWNER' and owner_id = auth.uid())
  with check (org_id = auth_org_id() and auth_role() = 'OWNER' and owner_id = auth.uid());
create policy chat_sessions_delete_owner on chat_sessions for delete to authenticated
  using (org_id = auth_org_id() and auth_role() = 'OWNER' and owner_id = auth.uid());

-- chat_messages: OWNER of the org only, tied to their own sessions
create policy chat_messages_select_owner on chat_messages for select to authenticated
  using (
    auth_role() = 'OWNER'
    and org_id = auth_org_id()
    and exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id and s.owner_id = auth.uid()
    )
  );
create policy chat_messages_insert_owner on chat_messages for insert to authenticated
  with check (
    auth_role() = 'OWNER'
    and org_id = auth_org_id()
    and exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id
        and s.owner_id = auth.uid()
        and s.org_id = chat_messages.org_id
    )
  );
