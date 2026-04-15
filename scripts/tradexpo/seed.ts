import { sql } from "@/lib/db/neon"
import {
  mockAssets,
  mockBoothTemplates,
  mockBoothTemplateUsage,
  mockBoothTypes,
  mockHallSlotUsage,
  mockHallTemplateSlots,
  mockHallTemplates,
  mockHallTemplateUsage,
} from "@/lib/tradexpo/mock-data"

async function ensureSchema() {
  await sql`
    create table if not exists model_assets (
      id text primary key,
      file_name text not null,
      file_url text not null,
      kind text not null,
      status text not null,
      created_at timestamptz not null
    )
  `

  await sql`
    create table if not exists hall_templates (
      id text primary key,
      name text not null,
      source_blend_asset_id text null references model_assets(id) on delete set null,
      render_glb_asset_id text not null references model_assets(id) on delete restrict,
      thumbnail_asset_id text not null references model_assets(id) on delete restrict,
      is_public boolean not null,
      is_active boolean not null,
      updated_by text not null,
      updated_at timestamptz not null
    )
  `

  await sql`
    create table if not exists hall_template_translations (
      id text primary key,
      hall_template_id text not null references hall_templates(id) on delete cascade,
      language_code text not null,
      name text not null,
      unique (hall_template_id, language_code)
    )
  `

  await sql`
    create table if not exists hall_template_usage (
      hall_template_id text primary key references hall_templates(id) on delete cascade,
      upcoming_expo_count int not null,
      live_expo_count int not null,
      archived_expo_count int not null
    )
  `

  await sql`
    create table if not exists hall_template_slots (
      id text primary key,
      hall_template_id text not null references hall_templates(id) on delete cascade,
      slot_code text not null,
      name text not null,
      pos_x double precision not null,
      pos_y double precision not null,
      pos_z double precision not null,
      rot_x double precision not null,
      rot_y double precision not null,
      rot_z double precision not null,
      scale_x double precision not null,
      scale_y double precision not null,
      scale_z double precision not null,
      width double precision not null,
      height double precision not null,
      depth double precision not null,
      metadata jsonb not null,
      unique (hall_template_id, slot_code)
    )
  `

  await sql`
    create table if not exists hall_slot_usage (
      slot_id text primary key references hall_template_slots(id) on delete cascade,
      upcoming_expo_count int not null,
      live_expo_count int not null
    )
  `

  await sql`
    create table if not exists booth_types (
      id text primary key,
      name text not null
    )
  `

  await sql`
    create table if not exists booth_templates (
      id text primary key,
      name text not null,
      booth_type_id text not null references booth_types(id) on delete restrict,
      source_blend_asset_id text null references model_assets(id) on delete set null,
      render_glb_asset_id text not null references model_assets(id) on delete restrict,
      thumbnail_asset_id text not null references model_assets(id) on delete restrict,
      description text not null,
      is_public boolean not null,
      is_active boolean not null,
      updated_by text not null,
      updated_at timestamptz not null
    )
  `

  await sql`
    create table if not exists booth_template_translations (
      id text primary key,
      booth_template_id text not null references booth_templates(id) on delete cascade,
      language_code text not null,
      name text not null,
      unique (booth_template_id, language_code)
    )
  `

  await sql`
    create table if not exists booth_template_usage (
      booth_template_id text primary key references booth_templates(id) on delete cascade,
      upcoming_expo_booth_count int not null,
      live_expo_booth_count int not null,
      archived_expo_booth_count int not null
    )
  `
}

async function clearData() {
  await sql`truncate table booth_template_translations cascade;`
  await sql`truncate table booth_template_usage cascade;`
  await sql`truncate table booth_templates cascade;`
  await sql`truncate table booth_types cascade;`
  await sql`truncate table hall_slot_usage cascade;`
  await sql`truncate table hall_template_slots cascade;`
  await sql`truncate table hall_template_usage cascade;`
  await sql`truncate table hall_template_translations cascade;`
  await sql`truncate table hall_templates cascade;`
  await sql`truncate table model_assets cascade;`
}

export async function seedTradeXpo() {
  await ensureSchema()
  await clearData()

  for (const a of mockAssets) {
    await sql`
      insert into model_assets (id, file_name, file_url, kind, status, created_at)
      values (${a.id}, ${a.fileName}, ${a.fileUrl}, ${a.kind}, ${a.status}, ${new Date(a.createdAt)})
    `
  }

  for (const t of mockHallTemplates) {
    await sql`
      insert into hall_templates (
        id, name, source_blend_asset_id, render_glb_asset_id, thumbnail_asset_id,
        is_public, is_active, updated_by, updated_at
      ) values (
        ${t.id}, ${t.name}, ${t.sourceBlendAssetId ?? null}, ${t.renderGlbAssetId}, ${t.thumbnailAssetId},
        ${t.isPublic}, ${t.isActive}, ${t.updatedBy}, ${new Date(t.updatedAt)}
      )
    `
    for (const tr of t.translations) {
      await sql`
        insert into hall_template_translations (id, hall_template_id, language_code, name)
        values (${`${t.id}:${tr.languageCode}`}, ${t.id}, ${tr.languageCode}, ${tr.name})
      `
    }
  }

  for (const u of mockHallTemplateUsage) {
    await sql`
      insert into hall_template_usage (
        hall_template_id, upcoming_expo_count, live_expo_count, archived_expo_count
      ) values (
        ${u.hallTemplateId}, ${u.upcomingExpoCount}, ${u.liveExpoCount}, ${u.archivedExpoCount}
      )
    `
  }

  for (const s of mockHallTemplateSlots) {
    await sql`
      insert into hall_template_slots (
        id, hall_template_id, slot_code, name,
        pos_x, pos_y, pos_z, rot_x, rot_y, rot_z, scale_x, scale_y, scale_z,
        width, height, depth, metadata
      ) values (
        ${s.id}, ${s.hallTemplateId}, ${s.slotCode}, ${s.name},
        ${s.posX}, ${s.posY}, ${s.posZ}, ${s.rotX}, ${s.rotY}, ${s.rotZ},
        ${s.scaleX}, ${s.scaleY}, ${s.scaleZ},
        ${s.width}, ${s.height}, ${s.depth}, ${JSON.stringify(s.metadata)}
      )
    `
  }

  for (const u of mockHallSlotUsage) {
    await sql`
      insert into hall_slot_usage (slot_id, upcoming_expo_count, live_expo_count)
      values (${u.slotId}, ${u.upcomingExpoCount}, ${u.liveExpoCount})
    `
  }

  for (const bt of mockBoothTypes) {
    await sql`insert into booth_types (id, name) values (${bt.id}, ${bt.name})`
  }

  for (const t of mockBoothTemplates) {
    await sql`
      insert into booth_templates (
        id, name, booth_type_id, source_blend_asset_id, render_glb_asset_id, thumbnail_asset_id,
        description, is_public, is_active, updated_by, updated_at
      ) values (
        ${t.id}, ${t.name}, ${t.boothTypeId}, ${t.sourceBlendAssetId ?? null}, ${t.renderGlbAssetId}, ${t.thumbnailAssetId},
        ${t.description}, ${t.isPublic}, ${t.isActive}, ${t.updatedBy}, ${new Date(t.updatedAt)}
      )
    `
    for (const tr of t.translations) {
      await sql`
        insert into booth_template_translations (id, booth_template_id, language_code, name)
        values (${`${t.id}:${tr.languageCode}`}, ${t.id}, ${tr.languageCode}, ${tr.name})
      `
    }
  }

  for (const u of mockBoothTemplateUsage) {
    await sql`
      insert into booth_template_usage (
        booth_template_id, upcoming_expo_booth_count, live_expo_booth_count, archived_expo_booth_count
      ) values (
        ${u.boothTemplateId}, ${u.upcomingExpoBoothCount}, ${u.liveExpoBoothCount}, ${u.archivedExpoBoothCount}
      )
    `
  }
}

if (import.meta.main) {
  await seedTradeXpo()
  // eslint-disable-next-line no-console
  console.log("Seed complete.")
}
