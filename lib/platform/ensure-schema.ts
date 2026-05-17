import { sql } from "@/lib/db/neon"
import { CURRENT_USER_ID } from "@/lib/user/current-user"

let platformSchemaReady = false
const LATEST_PLATFORM_MIGRATION = "exhibitor_analytics_v1"

type SqlClient = typeof sql

export async function ensurePlatformPaymentConfig(db: SqlClient = sql) {
  await db`
    create table if not exists platform_payment_config (
      id text primary key,
      vnpay_enabled boolean not null,
      bank_transfer_enabled boolean not null,
      updated_at timestamptz not null,
      updated_by text not null
    )
  `
  await db`
    insert into platform_payment_config (
      id,
      vnpay_enabled,
      bank_transfer_enabled,
      updated_at,
      updated_by
    )
    values ('default', true, true, now(), 'system')
    on conflict (id) do nothing
  `
}

/** Creates platform tables (expos, orders, chat, streaming) for Neon. Idempotent. */
export async function ensurePlatformSchema() {
  if (platformSchemaReady) return

  // 1. Check if core schema is already initialized to skip basic setup
  try {
    const migrationApplied = (await sql`
      select name from platform_schema_migrations
    `) as { name: string }[]
    const appliedNames = new Set(migrationApplied.map((m) => m.name))

    // If the latest migration is applied, we can assume everything before it is also applied.
    if (appliedNames.has(LATEST_PLATFORM_MIGRATION)) {
      await ensurePlatformPaymentConfig()
      platformSchemaReady = true
      return
    }
  } catch (_e) {
    // Table might not exist yet, proceed with initialization
  }

  // 2. Initialize Core Tables (Individual calls to avoid NeonDbError)
  await sql`
    create table if not exists platform_schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `

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
  await migrateExpoStatusSchema()

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

  // 3. Sequential Migrations/Updates (Only run if not applied)
  const migrationApplied = (await sql`
    select name from platform_schema_migrations
  `) as { name: string }[]
  const appliedNames = new Set(migrationApplied.map((m) => m.name))

  if (!appliedNames.has("expo_status_no_ended_v1")) {
    await migrateExpoStatusSchema()
    await sql`
      insert into platform_schema_migrations (name)
      values ('expo_status_no_ended_v1')
      on conflict (name) do update set applied_at = now()
    `
  }

  if (!appliedNames.has("expos_slug_v1")) {
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
    await sql`insert into platform_schema_migrations (name) values ('expos_slug_v1') on conflict do nothing`
  }
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

  await ensurePlatformPaymentConfig()

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
      ('sys_admin', 'System Admin'),
      ('admin', 'Admin'),
      ('partner', 'Partner'),
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
      (${CURRENT_USER_ID}, 'sys_admin', null),
      (${CURRENT_USER_ID}, 'admin', null),
      (${CURRENT_USER_ID}, 'partner', null),
      (${CURRENT_USER_ID}, 'seller', null),
      (${CURRENT_USER_ID}, 'buyer', null)
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

  await sql`
    create table if not exists user_wishlist_exhibitors (
      user_id text not null references users(id) on delete cascade,
      registration_id text not null references seller_booth_registrations(id) on delete cascade,
      created_at timestamptz not null default now(),
      primary key (user_id, registration_id)
    )
  `

  await sql`
    create index if not exists idx_user_wishlist_exhibitors_created
    on user_wishlist_exhibitors (user_id, created_at desc)
  `

  if (!appliedNames.has("wishlist_targets_v1")) {
    await sql`
      create table if not exists user_wishlist_items (
        user_id text not null references users(id) on delete cascade,
        target_type text not null check (target_type in ('expo', 'product', 'seller')),
        target_id text not null,
        created_at timestamptz not null default now(),
        primary key (user_id, target_type, target_id)
      )
    `

    await sql`
      insert into user_wishlist_items (user_id, target_type, target_id, created_at)
      select user_id, 'seller', registration_id, created_at
      from user_wishlist_exhibitors
      on conflict (user_id, target_type, target_id) do nothing
    `

    await sql`
      create index if not exists idx_user_wishlist_items_user_created
      on user_wishlist_items (user_id, created_at desc)
    `

    await sql`
      create index if not exists idx_user_wishlist_items_target
      on user_wishlist_items (target_type, target_id)
    `

    await sql`
      insert into platform_schema_migrations (name)
      values ('wishlist_targets_v1')
      on conflict (name) do update set applied_at = now()
    `
  }

  await sql`
    create table if not exists expo_exhibitor_profile_visits (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      exhibitor_id text not null,
      visitor_user_id text references users(id) on delete set null,
      visitor_key text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_exhibitor_profile_visits_lookup
    on expo_exhibitor_profile_visits (expo_id, exhibitor_id, created_at desc)
  `

  await sql`
    create table if not exists expo_exhibitor_product_views (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      exhibitor_id text not null,
      product_id text not null,
      visitor_user_id text references users(id) on delete set null,
      visitor_key text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_exhibitor_product_views_lookup
    on expo_exhibitor_product_views (expo_id, exhibitor_id, product_id, created_at desc)
  `

  await sql`
    create table if not exists expo_exhibitor_product_chat_events (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      exhibitor_id text not null,
      product_id text,
      conversation_id text,
      visitor_user_id text references users(id) on delete set null,
      visitor_key text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_exhibitor_product_chat_events_lookup
    on expo_exhibitor_product_chat_events (expo_id, exhibitor_id, product_id, created_at desc)
  `

  await sql`
    create table if not exists expo_exhibitor_rfq_events (
      id text primary key,
      expo_id text not null references expos(id) on delete cascade,
      exhibitor_id text not null,
      product_id text,
      requester_user_id text references users(id) on delete set null,
      requester_key text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_expo_exhibitor_rfq_events_lookup
    on expo_exhibitor_rfq_events (expo_id, exhibitor_id, product_id, created_at desc)
  `

  await migrateExpoManagementSchema()
  await migratePartnerOrganizationSchema()
  await migrateExpoStatusSchema()
  await createDemoPerformanceIndexes()

  // Record final migrations to enable fast-path on next boot.
  await sql`
    insert into platform_schema_migrations (name)
    values ('wishlist_targets_v1')
    on conflict (name) do update set applied_at = now();
  `
  await sql`
    insert into platform_schema_migrations (name)
    values (${LATEST_PLATFORM_MIGRATION})
    on conflict (name) do update set applied_at = now();
  `

  platformSchemaReady = true
}

async function createDemoPerformanceIndexes() {
  await sql`
    create index if not exists idx_orders_customer_created
    on orders (customer_id, created_at desc)
  `
  await sql`
    create index if not exists idx_orders_pending_expiry
    on orders (payment_method, status, expires_at)
    where status = 'Pending Payment' and expires_at is not null
  `
  await sql`
    create index if not exists idx_orders_expo_name_status
    on orders (expo_name, status)
    where expo_name is not null
  `
  await sql`
    create index if not exists idx_transaction_log_order_processed
    on transaction_log (order_id, processed_at asc)
  `
  await sql`
    create index if not exists idx_expos_owner_created
    on expos (owner_user_id, created_at desc)
    where owner_user_id is not null
  `
  await sql`
    create index if not exists idx_expos_created
    on expos (created_at desc)
  `
  await sql`
    create index if not exists idx_expo_halls_expo_sort
    on expo_halls (expo_id, sort_order asc)
  `
  await sql`
    create index if not exists idx_seller_booth_registrations_expo_purchased
    on seller_booth_registrations (expo_id, purchased_at desc)
  `
  await sql`
    create index if not exists idx_go_live_events_expo_scheduled
    on go_live_events (expo_id, scheduled_start_at desc)
  `
  await sql`
    create index if not exists idx_go_live_events_stream_session
    on go_live_events (stream_session_id)
  `
  await sql`
    create index if not exists idx_live_comments_session_created
    on live_comments (stream_session_id, created_at asc)
  `
  await sql`
    create index if not exists idx_stream_sessions_created
    on stream_sessions (created_at desc)
  `
  await sql`
    create index if not exists idx_company_products_company_created
    on company_products (company_id, created_at desc)
  `
  await sql`
    create index if not exists idx_admin_notifications_created
    on admin_notifications (created_at desc)
  `
}

async function migrateExpoStatusSchema() {
  await sql`
    update expos
    set status = 'Archived'
    where status = 'Ended'
  `

  await sql`
    alter table expos drop constraint if exists expos_status_ck
  `

  await sql`
    alter table expos
    add constraint expos_status_ck
    check (status in ('Draft', 'Pending Review', 'Live', 'Archived', 'Canceled'))
  `
}

async function migratePartnerOrganizationSchema() {
  await sql`
    create table if not exists partner_organizations (
      id text primary key,
      name text not null,
      model text not null default 'co_host',
      partner_type text not null default 'expo_partner',
      status text not null default 'active',
      primary_user_id text references users(id) on delete set null,
      branding jsonb not null default '{}'::jsonb,
      settings jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    alter table partner_organizations
    add column if not exists partner_type text not null default 'expo_partner'
  `
  await sql`
    do $$
    begin
      alter table partner_organizations
      add constraint partner_organizations_model_ck
      check (model in ('co_host', 'turnkey', 'tenant'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    do $$
    begin
      alter table partner_organizations
      add constraint partner_organizations_partner_type_ck
      check (partner_type in ('strategic_partner', 'expo_partner', 'distribution_partner', 'alliance_partner', 'government_program_partner'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    do $$
    begin
      alter table partner_organizations
      add constraint partner_organizations_status_ck
      check (status in ('active', 'inactive'));
    exception
      when duplicate_object then null;
    end $$;
  `

  await sql`
    create table if not exists partner_memberships (
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      user_id text not null references users(id) on delete cascade,
      role text not null default 'primary_representative',
      status text not null default 'active',
      created_at timestamptz not null default now(),
      primary key (partner_org_id, user_id)
    )
  `
  await sql`
    do $$
    begin
      alter table partner_memberships drop constraint if exists partner_memberships_role_ck;
      alter table partner_memberships
      add constraint partner_memberships_role_ck
      check (role in (
        'primary_representative',
        'admin',
        'operator',
        'analyst',
        'partner_owner',
        'partner_admin',
        'program_manager',
        'business_manager',
        'operations',
        'finance',
        'viewer'
      ));
    end $$;
  `
  await sql`
    do $$
    begin
      alter table partner_memberships
      add constraint partner_memberships_status_ck
      check (status in ('active', 'inactive'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_partner_memberships_user
    on partner_memberships (user_id)
  `

  await sql`
    create table if not exists partner_expo_assignments (
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      expo_id text not null references expos(id) on delete cascade,
      partnership_model text not null default 'co_host',
      capabilities jsonb not null default '{}'::jsonb,
      assigned_at timestamptz not null default now(),
      primary key (partner_org_id, expo_id)
    )
  `
  await sql`
    do $$
    begin
      alter table partner_expo_assignments
      add constraint partner_expo_assignments_model_ck
      check (partnership_model in ('co_host', 'turnkey', 'tenant'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_partner_expo_assignments_expo
    on partner_expo_assignments (expo_id)
  `

  await sql`
    create table if not exists partner_turnkey_expo_requests (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      title text not null,
      industry text not null default '',
      target_start_date date,
      expected_enterprises int not null default 0,
      requested_booths int not null default 0,
      status text not null default 'submitted',
      notes text not null default '',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table partner_turnkey_expo_requests
      add constraint partner_turnkey_expo_requests_status_ck
      check (status in ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'converted'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_partner_turnkey_requests_org
    on partner_turnkey_expo_requests (partner_org_id, created_at desc)
  `
  await sql`
    alter table partner_turnkey_expo_requests
    add column if not exists reviewed_by text references users(id) on delete set null
  `
  await sql`
    alter table partner_turnkey_expo_requests
    add column if not exists reviewed_at timestamptz
  `
  await sql`
    alter table partner_turnkey_expo_requests
    add column if not exists rejection_reason text not null default ''
  `
  await sql`
    alter table partner_turnkey_expo_requests
    add column if not exists approved_payload_json jsonb not null default '{}'::jsonb
  `
  await sql`
    alter table partner_turnkey_expo_requests
    add column if not exists converted_expo_id text references expos(id) on delete set null
  `
  await sql`
    alter table partner_turnkey_expo_requests
    add column if not exists converted_at timestamptz
  `

  await sql`
    create table if not exists partner_enterprise_members (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      enterprise_id text references companies(id) on delete set null,
      enterprise_name text not null,
      contact_email text,
      activation_status text not null default 'invited',
      expo_participation_count int not null default 0,
      rfq_generated_count int not null default 0,
      trade_signal_count int not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table partner_enterprise_members
      add constraint partner_enterprise_members_activation_status_ck
      check (activation_status in ('invited', 'registered', 'profile_completed', 'expo_activated', 'rfq_generated'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_partner_enterprise_members_org
    on partner_enterprise_members (partner_org_id, created_at desc)
  `

  await sql`
    create table if not exists partner_deal_contexts (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      enterprise_member_id text not null references partner_enterprise_members(id) on delete cascade,
      expo_id text references expos(id) on delete set null,
      source_type text not null default 'partner_activation',
      source_id text,
      stage text not null default 'rfq_generated',
      owner_user_id text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      closed_at timestamptz
    )
  `
  await sql`
    do $$
    begin
      alter table partner_deal_contexts
      add constraint partner_deal_contexts_stage_ck
      check (stage in ('rfq_generated', 'qualified', 'meeting_scheduled', 'proposal_sent', 'closed_won', 'closed_lost'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_partner_deal_contexts_org
    on partner_deal_contexts (partner_org_id, stage)
  `
  await sql`
    create index if not exists idx_partner_deal_contexts_member
    on partner_deal_contexts (enterprise_member_id, updated_at desc)
  `
  await sql`
    create table if not exists partner_deal_context_events (
      id text primary key,
      deal_context_id text not null references partner_deal_contexts(id) on delete cascade,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      enterprise_member_id text not null references partner_enterprise_members(id) on delete cascade,
      from_stage text,
      to_stage text not null,
      actor_user_id text references users(id) on delete set null,
      note text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_partner_deal_context_events_context
    on partner_deal_context_events (deal_context_id, created_at asc)
  `
  await sql`
    create index if not exists idx_partner_deal_context_events_org
    on partner_deal_context_events (partner_org_id, created_at desc)
  `

  await sql`
    create table if not exists partner_quotas (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      quota_type text not null,
      label text not null,
      total_quantity int not null default 0,
      allocated_quantity int not null default 0,
      consumed_quantity int not null default 0,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table partner_quotas
      add constraint partner_quotas_type_ck
      check (quota_type in ('booth_credits', 'expo_program_quota', 'bulk_booth_inventory'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_partner_quotas_org
    on partner_quotas (partner_org_id, quota_type)
  `

  await sql`
    create table if not exists partner_quota_allocations (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      quota_id text not null references partner_quotas(id) on delete cascade,
      enterprise_member_id text not null references partner_enterprise_members(id) on delete cascade,
      allocated_quantity int not null default 0,
      consumed_quantity int not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (quota_id, enterprise_member_id)
    )
  `
  await sql`
    create index if not exists idx_partner_quota_allocations_member
    on partner_quota_allocations (enterprise_member_id)
  `

  await sql`
    create table if not exists partner_trade_credit_wallets (
      partner_org_id text primary key references partner_organizations(id) on delete cascade,
      balance numeric(15, 2) not null default 0,
      allocated numeric(15, 2) not null default 0,
      consumed numeric(15, 2) not null default 0,
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    create table if not exists partner_trade_credit_ledger (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      entry_type text not null,
      amount numeric(15, 2) not null,
      enterprise_member_id text references partner_enterprise_members(id) on delete set null,
      reference_type text,
      reference_id text,
      note text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_partner_trade_credit_ledger_org
    on partner_trade_credit_ledger (partner_org_id, created_at desc)
  `

  await sql`
    create table if not exists partner_invite_campaigns (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      name text not null,
      invite_code text not null unique,
      quota_id text references partner_quotas(id) on delete set null,
      status text not null default 'draft',
      claimed_count int not null default 0,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table partner_invite_campaigns
      add constraint partner_invite_campaigns_status_ck
      check (status in ('draft', 'active', 'paused', 'ended'));
    exception
      when duplicate_object then null;
    end $$;
  `

  await sql`
    create table if not exists partner_service_bundles (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      name text not null,
      description text not null default '',
      partner_service_price numeric(15, 2) not null default 0,
      arobid_service_price numeric(15, 2) not null default 0,
      discount_amount numeric(15, 2) not null default 0,
      partner_share_percent numeric(5, 2) not null default 0,
      status text not null default 'draft',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table partner_service_bundles
      add constraint partner_service_bundles_status_ck
      check (status in ('draft', 'published', 'archived'));
    exception
      when duplicate_object then null;
    end $$;
  `

  await sql`
    create table if not exists partner_revenue_events (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      source_type text not null,
      source_id text,
      gross_amount numeric(15, 2) not null default 0,
      partner_amount numeric(15, 2) not null default 0,
      arobid_amount numeric(15, 2) not null default 0,
      status text not null default 'recorded',
      created_at timestamptz not null default now()
    )
  `
  await sql`
    alter table partner_revenue_events
    add column if not exists model_type text not null default 'platform_billing'
  `
  await sql`
    do $$
    begin
      alter table partner_revenue_events
      add constraint partner_revenue_events_model_type_ck
      check (model_type in ('wholesale_partner', 'platform_billing'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create table if not exists partner_settlements (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      cycle_month text not null,
      gross_amount numeric(15, 2) not null default 0,
      partner_amount numeric(15, 2) not null default 0,
      arobid_amount numeric(15, 2) not null default 0,
      status text not null default 'pending',
      created_at timestamptz not null default now(),
      settled_at timestamptz
    )
  `
  await sql`
    alter table partner_settlements
    add column if not exists arobid_amount numeric(15, 2) not null default 0
  `
  await sql`
    do $$
    begin
      alter table partner_settlements
      add constraint partner_settlements_status_ck
      check (status in ('pending', 'settled', 'canceled'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create unique index if not exists idx_partner_settlements_unique_cycle
    on partner_settlements (partner_org_id, cycle_month)
  `
  await sql`
    create index if not exists idx_partner_settlements_org
    on partner_settlements (partner_org_id, cycle_month desc)
  `
  await sql`
    create table if not exists partner_settlement_audit_log (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      settlement_id text not null references partner_settlements(id) on delete cascade,
      event_type text not null,
      actor_user_id text references users(id) on delete set null,
      payload_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_partner_settlement_audit_log_settlement
    on partner_settlement_audit_log (settlement_id, created_at asc)
  `

  await migratePlanSubscriptionsSchema()
  await sql`
    insert into platform_schema_migrations (name)
    values ('plan_subscriptions_packages_v1')
    on conflict (name) do update set applied_at = now()
  `

  await sql`
    create table if not exists partner_service_executions (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      bundle_id text not null references partner_service_bundles(id) on delete cascade,
      revenue_event_id text references partner_revenue_events(id) on delete set null,
      enterprise_member_id text references partner_enterprise_members(id) on delete set null,
      status text not null default 'scheduled',
      owner_user_id text references users(id) on delete set null,
      scheduled_at timestamptz not null default now(),
      started_at timestamptz,
      delivered_at timestamptz,
      closed_at timestamptz,
      sla_due_at timestamptz,
      metadata_json jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table partner_service_executions
      add constraint partner_service_executions_status_ck
      check (status in ('scheduled', 'in_progress', 'delivered', 'closed', 'canceled'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_partner_service_executions_org
    on partner_service_executions (partner_org_id, status)
  `
  await sql`
    create table if not exists partner_service_execution_events (
      id text primary key,
      execution_id text not null references partner_service_executions(id) on delete cascade,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      from_status text,
      to_status text not null,
      actor_user_id text references users(id) on delete set null,
      note text,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_partner_service_execution_events_execution
    on partner_service_execution_events (execution_id, created_at asc)
  `

  await sql`
    create table if not exists partner_message_threads (
      id text primary key,
      partner_org_id text not null references partner_organizations(id) on delete cascade,
      context_type text not null,
      context_id text not null,
      subject text not null,
      participant_label text not null default '',
      status text not null default 'open',
      created_by_user_id text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table partner_message_threads
      add constraint partner_message_threads_context_type_ck
      check (context_type in ('service_inquiry', 'bundle_purchase', 'deal_support', 'expo_participation'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    do $$
    begin
      alter table partner_message_threads
      add constraint partner_message_threads_status_ck
      check (status in ('open', 'closed'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_partner_message_threads_org
    on partner_message_threads (partner_org_id, updated_at desc)
  `

  await sql`
    create table if not exists partner_thread_messages (
      id text primary key,
      thread_id text not null references partner_message_threads(id) on delete cascade,
      sender_user_id text references users(id) on delete set null,
      sender_label text not null,
      body text not null,
      created_at timestamptz not null default now()
    )
  `
  await sql`
    create index if not exists idx_partner_thread_messages_thread
    on partner_thread_messages (thread_id, created_at asc)
  `

  await sql`
    insert into partner_organizations (
      id,
      name,
      model,
      partner_type,
      status,
      primary_user_id,
      created_at,
      updated_at
    )
    select distinct
      'partner-org-' || encode(sha256(e.owner_user_id::bytea), 'hex'),
      coalesce(nullif(u.name, ''), e.owner_email),
      'co_host',
      'expo_partner',
      'active',
      e.owner_user_id,
      now(),
      now()
    from expos e
    inner join users u on u.id = e.owner_user_id
    where e.owner_user_id is not null
    on conflict (id) do update
    set
      name = excluded.name,
      partner_type = excluded.partner_type,
      primary_user_id = excluded.primary_user_id,
      updated_at = now()
  `
  await sql`
    insert into partner_memberships (partner_org_id, user_id, role, status)
    select distinct
      'partner-org-' || encode(sha256(e.owner_user_id::bytea), 'hex'),
      e.owner_user_id,
      'primary_representative',
      'active'
    from expos e
    inner join users u on u.id = e.owner_user_id
    where e.owner_user_id is not null
    on conflict (partner_org_id, user_id) do update
    set
      role = excluded.role,
      status = excluded.status
  `
  await sql`
    insert into partner_expo_assignments (
      partner_org_id,
      expo_id,
      partnership_model,
      capabilities
    )
    select distinct
      'partner-org-' || encode(sha256(e.owner_user_id::bytea), 'hex'),
      e.id,
      'co_host',
      '{}'::jsonb
    from expos e
    inner join users u on u.id = e.owner_user_id
    where e.owner_user_id is not null
    on conflict (partner_org_id, expo_id) do nothing
  `
}

async function migratePlanSubscriptionsSchema() {
  await sql`
    create table if not exists plans (
      id text primary key,
      code text not null unique,
      name text not null,
      target_type text not null,
      tier_rank int not null default 1,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    do $$
    begin
      alter table plans
      add constraint plans_target_type_ck
      check (target_type in ('ORGANIZATION', 'EXPO'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create table if not exists packages (
      id text primary key,
      code text not null unique,
      name text not null,
      description text,
      price numeric(15, 2) not null default 0,
      price_unit text not null default 'VND',
      image_url text,
      is_public boolean not null default false,
      is_active boolean not null default true,
      created_by text not null references users(id) on delete restrict,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `
  await sql`
    alter table packages add column if not exists price numeric(15, 2) not null default 0
  `
  await sql`
    alter table packages add column if not exists price_unit text not null default 'VND'
  `
  await sql`
    alter table packages add column if not exists image_url text
  `
  await sql`
    alter table packages add column if not exists is_public boolean not null default false
  `
  await sql`
    create table if not exists package_plans (
      id text primary key,
      package_id text not null references packages(id) on delete cascade,
      plan_id text not null references plans(id) on delete restrict,
      role_code text not null references roles(id) on delete restrict,
      validity_type text not null,
      duration_months int,
      expo_id text references expos(id) on delete restrict,
      created_at timestamptz not null default now(),
      unique (package_id, plan_id, role_code)
    )
  `
  await sql`
    do $$
    begin
      alter table package_plans
      add constraint package_plans_validity_type_ck
      check (validity_type in ('DURATION', 'EVENT_BOUND'));
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    do $$
    begin
      alter table package_plans
      add constraint package_plans_validity_value_ck
      check (
        (validity_type = 'DURATION' and duration_months is not null and duration_months > 0 and expo_id is null)
        or
        (validity_type = 'EVENT_BOUND' and expo_id is not null and duration_months is null)
      );
    exception
      when duplicate_object then null;
    end $$;
  `
  await sql`
    create index if not exists idx_package_plans_package
    on package_plans (package_id)
  `
  await sql`
    create index if not exists idx_package_plans_plan
    on package_plans (plan_id)
  `
  await sql`
    insert into plans (id, code, name, target_type, tier_rank)
    values
      ('plan-b2b-pro', 'b2b_pro', 'B2B Pro', 'ORGANIZATION', 1),
      ('plan-b2b-enterprise', 'b2b_enterprise', 'B2B Enterprise', 'ORGANIZATION', 2),
      ('plan-tx-premium', 'tx_premium', 'TradeXpo Premium', 'EXPO', 2)
    on conflict (id) do update
    set
      code = excluded.code,
      name = excluded.name,
      target_type = excluded.target_type,
      tier_rank = excluded.tier_rank,
      updated_at = now()
  `
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
}
