import { sql } from "@/lib/db/neon"

export async function ensureBadgeSchema() {
  await sql`
    create table if not exists badge_level_types (
      id text primary key,
      name text not null,
      description text not null default '',
      min_level int not null default 1,
      max_level int not null default 5,
      sort_order int not null default 0,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      check (min_level >= 1),
      check (max_level <= 5),
      check (min_level <= max_level)
    )
  `

  await sql`
    create table if not exists badges (
      id text primary key,
      name text not null,
      module text not null,
      group_name text not null,
      level_type_id text not null references badge_level_types(id) on delete restrict,
      level int not null check (level between 1 and 5),
      condition text not null default '',
      where_it_appears text not null default '',
      design_link text,
      status text not null default 'active' check (status in ('draft', 'active', 'archived')),
      sort_order int not null default 0,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create index if not exists idx_badges_level_type
    on badges (level_type_id, level, sort_order)
  `

  await sql`
    create index if not exists idx_badges_status
    on badges (status, sort_order)
  `

  await sql`
    create table if not exists badge_display_contexts (
      id text primary key,
      title text not null,
      target text not null check (target in ('Supplier', 'Product', 'RFQ', 'TradeXpo')),
      surface text not null,
      is_active boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `

  await sql`
    create table if not exists badge_display_rankings (
      context_id text not null references badge_display_contexts(id) on delete cascade,
      badge_id text not null references badges(id) on delete cascade,
      active boolean not null default true,
      priority int not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (context_id, badge_id)
    )
  `

  await sql`
    create index if not exists idx_badge_display_rankings_context_priority
    on badge_display_rankings (context_id, priority)
  `

  await sql`
    create index if not exists idx_badge_display_rankings_badge
    on badge_display_rankings (badge_id)
  `

  await sql`
    create table if not exists company_badges (
      company_id text not null references companies(id) on delete cascade,
      badge_id text not null references badges(id) on delete cascade,
      status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'expired')),
      evidence_url text,
      issued_at timestamptz,
      expires_at timestamptz,
      verified_at timestamptz,
      verified_by text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (company_id, badge_id)
    )
  `

  await sql`
    create index if not exists idx_company_badges_badge
    on company_badges (badge_id)
  `

  await sql`
    create table if not exists company_product_badges (
      product_id text not null references company_products(id) on delete cascade,
      badge_id text not null references badges(id) on delete cascade,
      status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'expired')),
      evidence_url text,
      issued_at timestamptz,
      expires_at timestamptz,
      verified_at timestamptz,
      verified_by text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (product_id, badge_id)
    )
  `

  await sql`
    create index if not exists idx_company_product_badges_badge
    on company_product_badges (badge_id)
  `

  await sql`
    create table if not exists expo_badges (
      expo_id text not null references expos(id) on delete cascade,
      badge_id text not null references badges(id) on delete cascade,
      status text not null default 'pending' check (status in ('pending', 'verified', 'rejected', 'expired')),
      evidence_url text,
      issued_at timestamptz,
      expires_at timestamptz,
      verified_at timestamptz,
      verified_by text references users(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (expo_id, badge_id)
    )
  `

  await sql`
    create index if not exists idx_expo_badges_badge
    on expo_badges (badge_id)
  `
}
