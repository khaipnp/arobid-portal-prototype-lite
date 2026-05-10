import { sql } from "@/lib/db/neon"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

let platformSchemaReady = false

/** Creates platform tables (expos, orders, chat, streaming) for Neon. Idempotent. */
export async function ensurePlatformSchema() {
  if (platformSchemaReady) return
  await sql`
    create table if not exists expo_categories (
      id text primary key,
      name text not null,
      level int not null,
      parent_id text references expo_categories(id) on delete set null
    )
  `

  await sql`
    create table if not exists expos (
      id text primary key,
      slug text,
      name text not null,
      thumbnail_url text not null,
      owner_email text not null,
      start_date date not null,
      end_date date not null,
      status text not null,
      category_ids jsonb not null,
      created_at timestamptz not null
    )
  `
  await sql`alter table expos add column if not exists slug text`
  await sql`
    update expos
    set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'))
    where slug is null or length(trim(slug)) = 0
  `
  await sql`
    update expos
    set slug = slug || '-' || right(id, 6)
    where id in (
      select id
      from (
        select id, slug, row_number() over (partition by slug order by created_at asc, id asc) as rn
        from expos
        where slug is not null
      ) t
      where t.rn > 1
    )
  `
  await sql`
    create unique index if not exists idx_expos_slug_unique
    on expos (slug)
    where slug is not null
  `

  await sql`
    create table if not exists admin_notifications (
      id text primary key,
      kind text not null,
      title text not null,
      message text not null,
      related_expo_id text,
      created_at timestamptz not null,
      is_read boolean not null
    )
  `

  await sql`
    create table if not exists expo_booth_template_assignments (
      expo_id text primary key references expos(id) on delete cascade,
      booth_template_ids jsonb not null
    )
  `

  await sql`
    create table if not exists booth_template_customization_configs (
      booth_template_id text primary key,
      color_slots int not null,
      image_slots int not null,
      product_limit int not null,
      has_video boolean not null
    )
  `

  await sql`
    create table if not exists company_products (
      id text primary key,
      company_id text not null references companies(id) on delete cascade,
      name text not null,
      description text,
      price numeric(15, 2),
      currency text default 'VND',
      sku text,
      main_image_url text,
      gallery_urls jsonb default '[]'::jsonb,
      category_id text references exhibitor_categories(id) on delete set null,
      is_active boolean not null default true,
      metadata jsonb default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  // Data migration: If old table exists, move products to a default company (Arobid)
  await sql`
    do $$
    begin
      if exists (select 1 from information_schema.tables where table_name = 'exhibitor_catalog_products') then
        insert into company_products (id, company_id, name, description, main_image_url)
        select id, 'comp-' || encode(sha256('Arobid'::bytea), 'hex'), name, description, image_url
        from exhibitor_catalog_products
        on conflict (id) do nothing;
      end if;
    end $$;
  `

  await sql`drop table if exists exhibitor_catalog_products cascade`
  await sql`
    create table if not exists exhibitor_categories (
      id text primary key,
      name text not null,
      level int not null check (level between 1 and 3),
      parent_id text references exhibitor_categories(id) on delete cascade,
      sort_order int not null default 0,
      is_active boolean not null default true
    )
  `
  await sql`
    create table if not exists companies (
      id text primary key,
      name text not null,
      tax_id text,
      logo_url text,
      website text,
      address text,
      industry_id text references exhibitor_categories(id) on delete set null,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_exhibitor_categories_parent
    on exhibitor_categories (parent_id, sort_order asc, name asc)
  `

  await sql`
    create table if not exists seller_booth_registrations (
      id text primary key,
      user_id text not null,
      expo_id text not null references expos(id) on delete cascade,
      slot_id text,
      booth_template_id text,
      booth_ref text not null,
      booth_tier text not null,
      status text not null,
      purchased_at timestamptz not null
    )
  `

  await sql`
    create table if not exists booth_customizations (
      registration_id text primary key references seller_booth_registrations(id) on delete cascade,
      selected_booth_template_id text,
      publish_status text not null,
      colors jsonb not null,
      logo_url text not null,
      image_urls jsonb not null,
      video_type text,
      video_url text not null,
      products jsonb not null
    )
  `

  await sql`
    create table if not exists stream_sessions (
      stream_session_id text primary key,
      status text not null,
      host_user_id text not null,
      host_display_name text not null,
      stream_url text not null,
      stream_key text not null,
      replay_enabled boolean not null,
      replay_url text,
      started_at timestamptz,
      ended_at timestamptz,
      peak_viewer_count int,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `

  await sql`
    create table if not exists live_comments (
      live_comment_id text primary key,
      stream_session_id text not null references stream_sessions(stream_session_id) on delete cascade,
      author_user_id text,
      author_display_name text,
      guest_display_name text,
      guest_email text,
      comment_text text not null,
      is_deleted boolean not null,
      created_at timestamptz not null,
      deleted_at timestamptz,
      deleted_by_user_id text
    )
  `

  await sql`
    create table if not exists go_live_events (
      go_live_event_id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      stream_session_id text not null references stream_sessions(stream_session_id) on delete restrict,
      title text not null,
      description text,
      thumbnail_url text,
      session_type text not null,
      scheduled_start_at timestamptz,
      status text not null,
      broadcaster_user_id text not null,
      broadcaster_display_name text not null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `

  await sql`
    create table if not exists bank_accounts (
      id text primary key,
      bank_name text not null,
      bank_bin text not null,
      account_number text not null,
      account_holder_name text not null,
      branch text,
      is_primary boolean not null,
      is_active boolean not null,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `

  await sql`
    create table if not exists platform_payment_config (
      id text primary key,
      vnpay_enabled boolean not null,
      bank_transfer_enabled boolean not null,
      updated_at timestamptz not null,
      updated_by text not null
    )
  `

  await sql`
    create table if not exists expo_payment_configs (
      expo_id text primary key references expos(id) on delete cascade,
      is_inherited boolean not null,
      vnpay_enabled boolean not null,
      bank_transfer_enabled boolean not null,
      bank_account_id text references bank_accounts(id) on delete set null,
      updated_at timestamptz not null,
      updated_by text not null
    )
  `

  await sql`
    create table if not exists orders (
      id text primary key,
      customer_id text not null,
      customer_name text not null,
      customer_email text not null,
      customer_company text not null,
      partner_name text,
      order_type text not null,
      reference_id text not null,
      expo_name text,
      booth_ref text,
      booth_tier text,
      original_amount numeric not null default 0,
      discount_amount numeric not null default 0,
      amount numeric not null,
      voucher_id text,
      payment_method text not null,
      status text not null,
      expires_at timestamptz,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
  `

  await sql`alter table seller_booth_registrations add column if not exists user_id text`
  await sql`
    update seller_booth_registrations
    set user_id = ${CURRENT_USER_ID}
    where user_id is null
  `
  await sql`
    insert into users (id, name, email, is_active)
    select distinct
      sbr.user_id,
      sbr.user_id,
      sbr.user_id || '@placeholder.local',
      true
    from seller_booth_registrations sbr
    left join users u on u.id = sbr.user_id
    where u.id is null
  `
  await sql`
    alter table seller_booth_registrations alter column user_id set not null
  `
  await sql`
    do $$
    begin
      alter table seller_booth_registrations
      drop constraint if exists seller_booth_registrations_user_id_fkey;
      alter table seller_booth_registrations
      add constraint seller_booth_registrations_user_id_fkey
      foreign key (user_id) references users(id) on delete cascade;
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_seller_booth_registrations_user_purchased
    on seller_booth_registrations (user_id, purchased_at desc)
  `

  await sql`alter table orders add column if not exists partner_name text`
  await sql`alter table orders alter column expo_name drop not null`
  await sql`alter table orders alter column booth_ref drop not null`
  await sql`alter table orders alter column booth_tier drop not null`
  await sql`
    alter table orders add column if not exists original_amount numeric not null default 0
  `
  await sql`
    alter table orders add column if not exists discount_amount numeric not null default 0
  `
  await sql`alter table orders add column if not exists voucher_id text`
  await sql`
    alter table orders add column if not exists invoice_requested boolean not null default false
  `
  await sql`alter table orders add column if not exists invoice_type text`
  await sql`
    alter table orders add column if not exists billing_info_snapshot jsonb
  `
  await sql`
    alter table orders add column if not exists invoice_status text not null default 'not_requested'
  `
  await sql`alter table orders add column if not exists paid_at timestamptz`
  await sql`alter table orders add column if not exists exported_at timestamptz`
  await sql`alter table orders add column if not exists exported_by text`
  await sql`alter table orders add column if not exists export_batch_id text`
  await sql`alter table orders add column if not exists issued_at timestamptz`
  await sql`alter table orders add column if not exists issued_by text`
  await sql`alter table orders add column if not exists sent_at timestamptz`
  await sql`alter table orders add column if not exists sent_by text`
  await sql`
    update orders
    set original_amount = amount
    where original_amount = 0 and amount <> 0
  `

  await sql`
    create table if not exists transaction_log (
      id text primary key,
      order_id text not null references orders(id) on delete cascade,
      type text not null,
      status text not null,
      actor text not null,
      note text,
      rejection_reason text,
      processed_at timestamptz not null
    )
  `

  await sql`
    update orders
    set
      status = 'Cancelled',
      updated_at = now()
    where status in ('Failed', 'Expired', 'Cancel')
  `

  await sql`
    update transaction_log
    set status = 'Cancelled'
    where status in ('Failed', 'Expired', 'Cancel')
  `

  await sql`
    create table if not exists users (
      id text primary key,
      name text not null,
      email text not null,
      company_id text references companies(id) on delete set null,
      industry text,
      industry_category_id text references exhibitor_categories(id) on delete set null,
      job_title text,
      phone text,
      website text,
      location text,
      avatar_url text,
      is_active boolean not null
    )
  `
  await sql`
    create table if not exists auth_identities (
      id uuid primary key default gen_random_uuid(),
      user_id text not null references users(id) on delete cascade,
      email text not null unique,
      password_hash text not null,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (user_id)
    )
  `
  await sql`
    create table if not exists auth_sessions (
      session_id uuid primary key,
      user_id text not null references users(id) on delete cascade,
      user_agent text,
      ip_address text,
      expires_at timestamptz not null,
      revoked_at timestamptz,
      last_seen_at timestamptz not null default now(),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_auth_sessions_user_id
    on auth_sessions (user_id)
  `
  await sql`
    create index if not exists idx_auth_sessions_expires_at
    on auth_sessions (expires_at)
  `
  await sql`
    create table if not exists platform_schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `
  const uuidMigrationApplied = (await sql`
    select 1
    from platform_schema_migrations
    where name = 'users_uuid_normalization_v1'
    limit 1
  `) as { "?column?": number }[]
  if (uuidMigrationApplied.length === 0) {
    await sql`
      do $$
      begin
        alter table seller_booth_registrations drop constraint if exists seller_booth_registrations_user_id_fkey;
        alter table user_roles drop constraint if exists user_roles_user_id_fkey;
        alter table chat_conversation_members drop constraint if exists chat_conversation_members_user_id_fkey;
        alter table chat_unread_counts drop constraint if exists chat_unread_counts_user_id_fkey;
        alter table notifications drop constraint if exists notifications_user_id_fkey;
      exception
        when undefined_table then null;
      end $$;
    `
    await sql`
      create table if not exists schema_user_id_map_tmp (
        old_id text primary key,
        new_id text not null
      )
    `
    await sql`delete from schema_user_id_map_tmp`
    await sql`
      insert into schema_user_id_map_tmp (old_id, new_id)
      select
        id,
        case
          when id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then lower(id)
          when id = 'user-current' then '11111111-1111-4111-8111-111111111111'
          when id = 'seller-1' then '22222222-2222-4222-8222-222222222222'
          when id = 'buyer-1' then '77777777-7777-4777-8777-777777777777'
          when id = 'user-nguyen' then '22222222-2222-4222-8222-222222222222'
          when id = 'user-nina' then '33333333-3333-4333-8333-333333333333'
          when id = 'user-minh' then '44444444-4444-4444-8444-444444444444'
          when id = 'user-sarah' then '55555555-5555-4555-8555-555555555555'
          when id = 'user-tommy' then '66666666-6666-4666-8666-666666666666'
          else gen_random_uuid()::text
        end
      from users
      on conflict (old_id) do update
      set new_id = excluded.new_id
    `
    await sql`
      update seller_booth_registrations s
      set user_id = m.new_id
      from schema_user_id_map_tmp m
      where s.user_id = m.old_id and s.user_id <> m.new_id
    `
    await sql`
      update user_roles ur
      set user_id = m.new_id
      from schema_user_id_map_tmp m
      where ur.user_id = m.old_id and ur.user_id <> m.new_id
    `
    await sql`
      update chat_users cu
      set id = m.new_id
      from schema_user_id_map_tmp m
      where cu.id = m.old_id and cu.id <> m.new_id
    `
    await sql`
      update chat_conversation_members ccm
      set user_id = m.new_id
      from schema_user_id_map_tmp m
      where ccm.user_id = m.old_id and ccm.user_id <> m.new_id
    `
    await sql`
      update chat_unread_counts cuc
      set user_id = m.new_id
      from schema_user_id_map_tmp m
      where cuc.user_id = m.old_id and cuc.user_id <> m.new_id
    `
    await sql`
      update chat_messages cm
      set sender_id = m.new_id
      from schema_user_id_map_tmp m
      where cm.sender_id = m.old_id and cm.sender_id <> m.new_id
    `
    await sql`
      update notifications n
      set user_id = m.new_id
      from schema_user_id_map_tmp m
      where n.user_id = m.old_id and n.user_id <> m.new_id
    `
    await sql`
      update stream_sessions ss
      set host_user_id = m.new_id
      from schema_user_id_map_tmp m
      where ss.host_user_id = m.old_id and ss.host_user_id <> m.new_id
    `
    await sql`
      update live_comments lc
      set author_user_id = m.new_id
      from schema_user_id_map_tmp m
      where lc.author_user_id = m.old_id and lc.author_user_id <> m.new_id
    `
    await sql`
      update live_comments lc
      set deleted_by_user_id = m.new_id
      from schema_user_id_map_tmp m
      where lc.deleted_by_user_id = m.old_id and lc.deleted_by_user_id <> m.new_id
    `
    await sql`
      update go_live_events gle
      set broadcaster_user_id = m.new_id
      from schema_user_id_map_tmp m
      where gle.broadcaster_user_id = m.old_id and gle.broadcaster_user_id <> m.new_id
    `
    await sql`
      update expos e
      set owner_user_id = m.new_id
      from schema_user_id_map_tmp m
      where e.owner_user_id = m.old_id and e.owner_user_id <> m.new_id
    `
    await sql`
      update orders o
      set customer_id = m.new_id
      from schema_user_id_map_tmp m
      where o.customer_id = m.old_id and o.customer_id <> m.new_id
    `
    await sql`
      update orders o
      set exported_by = m.new_id
      from schema_user_id_map_tmp m
      where o.exported_by = m.old_id and o.exported_by <> m.new_id
    `
    await sql`
      update orders o
      set issued_by = m.new_id
      from schema_user_id_map_tmp m
      where o.issued_by = m.old_id and o.issued_by <> m.new_id
    `
    await sql`
      update orders o
      set sent_by = m.new_id
      from schema_user_id_map_tmp m
      where o.sent_by = m.old_id and o.sent_by <> m.new_id
    `
    await sql`
      update users u
      set id = m.new_id
      from schema_user_id_map_tmp m
      where u.id = m.old_id and u.id <> m.new_id
    `
    await sql`
      insert into platform_schema_migrations (name)
      values ('users_uuid_normalization_v1')
      on conflict (name) do nothing
    `
  }
  await sql`alter table users add column if not exists industry text`
  await sql`
    alter table users
    add column if not exists industry_category_id text
  `
  await sql`
    do $$
    begin
      alter table users
      add constraint users_industry_category_fk
      foreign key (industry_category_id)
      references exhibitor_categories(id)
      on delete set null;
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_users_industry_category
    on users (industry_category_id)
  `
  await sql`
    alter table users
    add constraint users_id_uuid_format_ck
    check (id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
    not valid
  `.catch(() => null)
  await sql`alter table users validate constraint users_id_uuid_format_ck`.catch(
    () => null
  )
  await sql`
    create table if not exists roles (
      id text primary key,
      name text not null unique
    )
  `
  await sql`
    create table if not exists user_roles (
      user_id text not null references users(id) on delete cascade,
      role_id text not null references roles(id) on delete cascade,
      expo_id text references expos(id) on delete cascade,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create unique index if not exists uq_user_roles_scope
    on user_roles (user_id, role_id, coalesce(expo_id, 'global'))
  `
  await sql`
    create index if not exists idx_user_roles_user
    on user_roles (user_id)
  `
  await sql`
    insert into roles (id, name)
    values
      ('admin', 'Admin'),
      ('seller', 'Seller'),
      ('buyer', 'Buyer'),
      ('exhibitor', 'Exhibitor')
    on conflict (id) do update
    set name = excluded.name
  `

  await sql`
    create table if not exists chat_users (
      id text primary key,
      name text not null,
      email text not null,
      company_id text references companies(id) on delete set null,
      job_title text,
      phone text,
      website text,
      location text,
      avatar_url text,
      is_active boolean not null
    )
  `
  await sql`alter table chat_users drop column if exists company`
  await sql`alter table chat_users drop column if exists industry`
  await sql`alter table chat_users drop column if exists industry_category_id`
  await sql`
    alter table chat_users
    add constraint chat_users_id_uuid_format_ck
    check (id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
    not valid
  `.catch(() => null)
  await sql`alter table chat_users validate constraint chat_users_id_uuid_format_ck`.catch(
    () => null
  )
  await sql`alter table users add column if not exists company_id text references companies(id) on delete set null`
  await sql`alter table chat_users add column if not exists company_id text references companies(id) on delete set null`

  // Data migration: Create companies from existing user company strings
  await sql`
    do $$
    begin
      if exists (select 1 from information_schema.columns where table_name = 'users' and column_name = 'company') then
        insert into companies (id, name)
        select distinct
          'comp-' || encode(sha256(company::bytea), 'hex'),
          company
        from users
        where company is not null and company <> '' and company_id is null
        on conflict (id) do nothing;

        update users u
        set company_id = 'comp-' || encode(sha256(company::bytea), 'hex')
        where company_id is null and company is not null and company <> '';
      end if;
    end $$;
  `

  await sql`
    create table if not exists company_categories (
      company_id text not null references companies(id) on delete cascade,
      category_id text not null references exhibitor_categories(id) on delete cascade,
      primary key (company_id, category_id)
    )
  `

  // Migrate existing industry_id from companies to company_categories
  await sql`
    do $$
    begin
      if exists (select 1 from information_schema.columns where table_name = 'companies' and column_name = 'industry_id') then
        insert into company_categories (company_id, category_id)
        select id, industry_id from companies
        where industry_id is not null
        on conflict do nothing;
      end if;
    end $$;
  `

  await sql`alter table companies drop column if exists industry_id`
  await sql`alter table users drop column if exists industry`
  await sql`alter table users drop column if exists industry_category_id`

  await sql`
    insert into users (
      id,
      name,
      email,
      company_id,
      job_title,
      phone,
      website,
      location,
      avatar_url,
      is_active
    )
    select
      id,
      name,
      email,
      company_id,
      job_title,
      phone,
      website,
      location,
      avatar_url,
      is_active
    from chat_users
    on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      company_id = excluded.company_id,
      job_title = excluded.job_title,
      phone = excluded.phone,
      website = excluded.website,
      location = excluded.location,
      avatar_url = excluded.avatar_url,
      is_active = excluded.is_active
  `
  await sql`
    insert into companies (id, name)
    values ('comp-' || encode(sha256('Arobid'::bytea), 'hex'), 'Arobid')
    on conflict (id) do nothing
  `
  await sql`
    insert into users (id, name, email, company_id, is_active)
    values (
      ${CURRENT_USER_ID},
      'Khai Pham',
      'khaipham@arobid.com',
      'comp-' || encode(sha256('Arobid'::bytea), 'hex'),
      true
    )
    on conflict (id) do nothing
  `
  await sql`
    insert into user_roles (user_id, role_id, expo_id)
    values
      (${CURRENT_USER_ID}, 'admin', null),
      (${CURRENT_USER_ID}, 'seller', null),
      (${CURRENT_USER_ID}, 'buyer', null),
      (${CURRENT_USER_ID}, 'exhibitor', null)
    on conflict do nothing
  `
  await sql`
    insert into chat_users (
      id,
      name,
      email,
      company_id,
      job_title,
      phone,
      website,
      location,
      avatar_url,
      is_active
    )
    select
      id,
      name,
      email,
      company_id,
      job_title,
      phone,
      website,
      location,
      avatar_url,
      is_active
    from users
    on conflict (id) do update
    set
      name = excluded.name,
      email = excluded.email,
      company_id = excluded.company_id,
      job_title = excluded.job_title,
      phone = excluded.phone,
      website = excluded.website,
      location = excluded.location,
      avatar_url = excluded.avatar_url,
      is_active = excluded.is_active
  `

  await sql`
    create table if not exists chat_conversations (
      id text primary key,
      type text not null,
      created_at timestamptz not null,
      is_read_only boolean not null
    )
  `

  await sql`
    create table if not exists chat_conversation_members (
      conversation_id text not null references chat_conversations(id) on delete cascade,
      user_id text not null references chat_users(id) on delete cascade,
      joined_at timestamptz not null,
      is_archived boolean not null,
      primary key (conversation_id, user_id)
    )
  `

  await sql`
    create table if not exists chat_messages (
      id text primary key,
      conversation_id text not null references chat_conversations(id) on delete cascade,
      sender_id text not null,
      content text not null,
      attachments jsonb not null default '[]',
      status text not null,
      sent_at timestamptz not null,
      edited_at timestamptz,
      is_deleted boolean not null,
      is_system_message boolean not null
    )
  `

  await sql`
    create table if not exists chat_unread_counts (
      user_id text not null references chat_users(id) on delete cascade,
      conversation_id text not null references chat_conversations(id) on delete cascade,
      unread_count int not null,
      primary key (user_id, conversation_id)
    )
  `
  await sql`create index if not exists idx_chat_unread_counts_user on chat_unread_counts (user_id)`

  await sql`
    do $$
    begin
      alter table chat_conversation_members
      drop constraint if exists chat_conversation_members_user_id_fkey;
      alter table chat_conversation_members
      add constraint chat_conversation_members_user_id_fkey
      foreign key (user_id) references users(id) on delete cascade;
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`create index if not exists idx_chat_conversation_members_user on chat_conversation_members (user_id)`
  await sql`create index if not exists idx_chat_conversation_members_conv on chat_conversation_members (conversation_id)`

  await sql`create index if not exists idx_chat_messages_conv_sent on chat_messages (conversation_id, sent_at asc)`
  await sql`create index if not exists idx_chat_messages_sender on chat_messages (sender_id)`
  await sql`
    do $$
    begin
      alter table chat_unread_counts
      drop constraint if exists chat_unread_counts_user_id_fkey;
      alter table chat_unread_counts
      add constraint chat_unread_counts_user_id_fkey
      foreign key (user_id) references users(id) on delete cascade;
    exception
      when duplicate_object then null;
    end $$;
  `

  await sql`
    create table if not exists notifications (
      notification_id uuid primary key,
      user_id text not null,
      source text not null,
      type text not null,
      title varchar(80) not null,
      body varchar(120) not null,
      deep_link_path text not null,
      reference_id text,
      reference_type text,
      is_read boolean not null default false,
      created_at timestamptz not null default now(),
      read_at timestamptz
    )
  `
  await sql`
    insert into users (id, name, email, is_active)
    select distinct
      n.user_id,
      n.user_id,
      n.user_id || '@placeholder.local',
      true
    from notifications n
    left join users u on u.id = n.user_id
    where u.id is null
  `
  await sql`
    do $$
    begin
      alter table notifications
      drop constraint if exists notifications_user_id_fkey;
      alter table notifications
      add constraint notifications_user_id_fkey
      foreign key (user_id) references users(id) on delete cascade;
    exception
      when duplicate_object then null;
    end $$;
  `

  await sql`
    create index if not exists idx_notifications_user_created
    on notifications (user_id, created_at desc)
  `

  await sql`
    create index if not exists idx_notifications_user_unread
    on notifications (user_id)
    where is_read = false
  `

  await sql`
    create index if not exists idx_notifications_dedupe_lookup
    on notifications (user_id, source, type, reference_id, created_at desc)
    where reference_id is not null and reference_type is not null
  `

  await migrateExpoManagementSchema()
}

/** Idempotent columns/tables for Create Expo + hall configuration (US-02 / US-03). */
async function migrateExpoManagementSchema() {
  // Categories are flat now: force single-level taxonomy.
  await sql`
    update expo_categories
    set level = 1, parent_id = null
    where level <> 1 or parent_id is not null
  `
  await sql`
    do $$
    begin
      alter table expo_categories
      add constraint expo_categories_single_level_ck
      check (level = 1 and parent_id is null);
    exception
      when duplicate_object then null;
    end $$;
  `

  await sql`
    alter table expos add column if not exists description text not null default ''
  `
  await sql`
    alter table expos add column if not exists timezone text not null default 'Asia/Bangkok'
  `
  await sql`
    alter table expos add column if not exists expo_template_id text
  `
  await sql`
    alter table expos add column if not exists owner_user_id text
  `
  await sql`
    alter table expos add column if not exists start_at timestamptz
  `
  await sql`
    alter table expos add column if not exists end_at timestamptz
  `

  await sql`
    update expos
    set start_at = coalesce(start_at, start_date::timestamptz)
    where start_at is null
  `
  await sql`
    update expos
    set
      end_at = coalesce(
        end_at,
        (end_date::timestamp + time '23:59:59')::timestamptz
      )
    where end_at is null
  `

  await sql`
    create table if not exists expo_layout_templates (
      id text primary key,
      name text not null
    )
  `

  await sql`
    insert into expo_layout_templates (id, name) values
      ('layout-standard', 'Standard exhibition layout'),
      ('layout-multi-hall', 'Multi-hall floor plan'),
      ('layout-compact', 'Compact single-hall layout')
    on conflict (id) do nothing
  `

  await sql`
    create table if not exists expo_halls (
      id text primary key,
      expo_id text not null references expos (id) on delete cascade,
      sort_order int not null,
      hall_name text not null,
      hall_template_id text not null,
      basic_qty int not null,
      professional_qty int not null,
      premium_qty int not null
    )
  `

  await sql`
    create index if not exists expos_name_lower_uq on expos (lower(name))
  `

  await sql`
    create table if not exists assets (
      asset_id uuid primary key default gen_random_uuid(),
      file_name text not null,
      file_url text not null,
      kind text not null,
      status text not null default 'ready',
      metadata jsonb not null default '{}',
      created_at timestamptz not null default now()
    )
  `
  platformSchemaReady = true
}
