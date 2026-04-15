import { sql } from "@/lib/db/neon"

/** Creates platform tables (expos, orders, chat, streaming) for Neon. Idempotent. */
export async function ensurePlatformSchema() {
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
    create table if not exists exhibitor_catalog_products (
      id text primary key,
      name text not null,
      description text not null,
      image_url text
    )
  `

  await sql`
    create table if not exists seller_booth_registrations (
      id text primary key,
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
      order_type text not null,
      reference_id text not null,
      expo_name text not null,
      booth_ref text not null,
      booth_tier text not null,
      amount numeric not null,
      payment_method text not null,
      status text not null,
      expires_at timestamptz,
      created_at timestamptz not null,
      updated_at timestamptz not null
    )
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
    create table if not exists chat_users (
      id text primary key,
      name text not null,
      email text not null,
      company text not null,
      job_title text,
      phone text,
      website text,
      location text,
      avatar_url text,
      is_active boolean not null
    )
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
}
