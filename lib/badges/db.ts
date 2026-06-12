import { randomUUID } from "node:crypto"
import { ensureBadgeSchema } from "@/lib/badges/schema"
import {
  type BadgeDefinition,
  type BadgeDraft,
  type BadgeLevelType,
  type BadgeLevelTypeId,
  type BadgeRankingConfig,
  type BadgeStatus,
  type DisplayContext,
  type DisplayTarget,
  initialBadgeDefinitions,
  makeExternalBadgeId,
  badgeLevelTypes as seedBadgeLevelTypes,
  displayContexts as seedDisplayContexts
} from "@/lib/badges/seed-data"
import { sql } from "@/lib/db/neon"

export type BadgeManagementWorkspace = {
  levelTypes: BadgeLevelType[]
  badges: BadgeDefinition[]
  displayContexts: DisplayContext[]
}

type BadgeRow = {
  id: string
  name: string
  module: string
  group_name: string
  level_type_id: BadgeLevelTypeId
  level: number | string
  condition: string
  where_it_appears: string
  design_link: string | null
  status: BadgeStatus
  sort_order: number | string
}

type BadgeLevelTypeRow = {
  id: BadgeLevelTypeId
  name: string
  description: string
  min_level: number | string
  max_level: number | string
  sort_order: number | string
  is_active: boolean
}

type DisplayContextRow = {
  id: string
  title: string
  target: DisplayTarget
  surface: string
  ranking: BadgeRankingConfig[] | string | null
}

function toNumber(value: number | string) {
  return Number(value) || 0
}

function mapBadgeLevelType(row: BadgeLevelTypeRow): BadgeLevelType {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    minLevel: toNumber(row.min_level),
    maxLevel: toNumber(row.max_level),
    sortOrder: toNumber(row.sort_order),
    isActive: row.is_active
  }
}

function mapBadge(row: BadgeRow): BadgeDefinition {
  return {
    id: row.id,
    name: row.name,
    module: row.module,
    group: row.group_name,
    levelTypeId: row.level_type_id,
    level: toNumber(row.level),
    condition: row.condition,
    whereItAppears: row.where_it_appears,
    designLink: row.design_link ?? undefined,
    status: row.status,
    sortOrder: toNumber(row.sort_order)
  }
}

function parseRanking(
  value: DisplayContextRow["ranking"]
): BadgeRankingConfig[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value) as BadgeRankingConfig[]
    return Array.isArray(parsed) ? parsed : []
  } catch (_error) {
    return []
  }
}

function mapDisplayContext(row: DisplayContextRow): DisplayContext {
  return {
    id: row.id,
    title: row.title,
    target: row.target,
    surface: row.surface,
    ranking: parseRanking(row.ranking)
  }
}

function makeBadgeId(module: string, name: string) {
  return makeExternalBadgeId(
    module || "Badge",
    name || `Custom ${randomUUID()}`
  )
}

async function getLevelType(levelTypeId: string) {
  const rows = (await sql`
    select id, min_level, max_level
    from badge_level_types
    where id = ${levelTypeId}
    limit 1
  `) as { id: string; min_level: number | string; max_level: number | string }[]

  return rows[0]
}

async function assertLevelInput(levelTypeId: string, level: number) {
  const levelType = await getLevelType(levelTypeId)
  if (!levelType) throw new Error("Level type not found.")

  const minLevel = toNumber(levelType.min_level)
  const maxLevel = toNumber(levelType.max_level)
  if (level < minLevel || level > maxLevel) {
    throw new Error(`Level must be between ${minLevel} and ${maxLevel}.`)
  }
}

function normalizeBadgeInput(input: BadgeDraft) {
  const name = input.name.trim()
  if (!name) throw new Error("Badge name is required.")

  return {
    name,
    module: input.module.trim() || "General",
    group: input.group.trim() || "General",
    levelTypeId: input.levelTypeId || "trust",
    level: Math.trunc(Number(input.level) || 1),
    condition: input.condition.trim(),
    whereItAppears: input.whereItAppears.trim(),
    designLink: input.designLink.trim() || null
  }
}

async function ensureBadgeSeedMarkerTable() {
  await sql`
    create table if not exists platform_schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `
}

export async function seedBadgeManagementData() {
  await ensureBadgeSchema()
  await ensureBadgeSeedMarkerTable()

  for (const levelType of seedBadgeLevelTypes) {
    await sql`
      insert into badge_level_types (
        id,
        name,
        description,
        min_level,
        max_level,
        sort_order,
        is_active,
        updated_at
      )
      values (
        ${levelType.id},
        ${levelType.name},
        ${levelType.description},
        ${levelType.minLevel},
        ${levelType.maxLevel},
        ${levelType.sortOrder},
        ${levelType.isActive},
        now()
      )
      on conflict (id) do update set
        name = excluded.name,
        description = excluded.description,
        min_level = excluded.min_level,
        max_level = excluded.max_level,
        sort_order = excluded.sort_order,
        is_active = excluded.is_active,
        updated_at = now()
    `
  }

  for (const badge of initialBadgeDefinitions) {
    await sql`
      insert into badges (
        id,
        name,
        module,
        group_name,
        level_type_id,
        level,
        condition,
        where_it_appears,
        design_link,
        status,
        sort_order,
        updated_at
      )
      values (
        ${badge.id},
        ${badge.name},
        ${badge.module},
        ${badge.group},
        ${badge.levelTypeId},
        ${badge.level},
        ${badge.condition},
        ${badge.whereItAppears},
        ${badge.designLink ?? null},
        ${badge.status},
        ${badge.sortOrder ?? 0},
        now()
      )
      on conflict (id) do update set
        name = excluded.name,
        module = excluded.module,
        group_name = excluded.group_name,
        level_type_id = excluded.level_type_id,
        level = excluded.level,
        condition = excluded.condition,
        where_it_appears = excluded.where_it_appears,
        design_link = excluded.design_link,
        sort_order = excluded.sort_order,
        updated_at = now()
    `
  }

  for (const context of seedDisplayContexts) {
    await sql`
      insert into badge_display_contexts (
        id,
        title,
        target,
        surface,
        updated_at
      )
      values (
        ${context.id},
        ${context.title},
        ${context.target},
        ${context.surface},
        now()
      )
      on conflict (id) do update set
        title = excluded.title,
        target = excluded.target,
        surface = excluded.surface,
        updated_at = now()
    `

    for (const item of context.ranking) {
      await sql`
        insert into badge_display_rankings (
          context_id,
          badge_id,
          active,
          priority,
          updated_at
        )
        values (
          ${context.id},
          ${item.badgeId},
          ${item.active},
          ${item.priority},
          now()
        )
        on conflict (context_id, badge_id) do update set
          active = excluded.active,
          priority = excluded.priority,
          updated_at = now()
      `
    }
  }

  await sql`
    insert into platform_schema_migrations (name)
    values ('badge_management_seed_v1')
    on conflict (name) do update set applied_at = now()
  `
}

async function ensureBadgeSeeded() {
  await ensureBadgeSchema()
  await ensureBadgeSeedMarkerTable()

  const rows = (await sql`
    select 1
    from platform_schema_migrations
    where name = 'badge_management_seed_v1'
    limit 1
  `) as { "?column?": number }[]

  if (rows.length === 0) {
    await seedBadgeManagementData()
  }
}

export async function getBadgeManagementWorkspace(): Promise<BadgeManagementWorkspace> {
  await ensureBadgeSeeded()

  const [levelTypeRows, badgeRows, contextRows] = await Promise.all([
    sql`
      select id, name, description, min_level, max_level, sort_order, is_active
      from badge_level_types
      order by sort_order asc, name asc
    `,
    sql`
      select
        id,
        name,
        module,
        group_name,
        level_type_id,
        level,
        condition,
        where_it_appears,
        design_link,
        status,
        sort_order
      from badges
      where status <> 'archived'
      order by sort_order asc, name asc
    `,
    sql`
      select
        context.id,
        context.title,
        context.target,
        context.surface,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'badgeId', ranking.badge_id,
              'active', ranking.active,
              'priority', ranking.priority
            )
            order by ranking.priority asc
          ) filter (where ranking.badge_id is not null and badge.id is not null),
          '[]'::jsonb
        ) as ranking
      from badge_display_contexts context
      left join badge_display_rankings ranking
        on ranking.context_id = context.id
      left join badges badge
        on badge.id = ranking.badge_id
        and badge.status <> 'archived'
      where context.is_active = true
      group by context.id
      order by context.created_at asc, context.title asc
    `
  ])

  return {
    levelTypes: (levelTypeRows as BadgeLevelTypeRow[]).map(mapBadgeLevelType),
    badges: (badgeRows as BadgeRow[]).map(mapBadge),
    displayContexts: (contextRows as DisplayContextRow[]).map(mapDisplayContext)
  }
}

export async function createBadge(input: BadgeDraft) {
  await ensureBadgeSeeded()
  const normalized = normalizeBadgeInput(input)
  await assertLevelInput(normalized.levelTypeId, normalized.level)

  let id = makeBadgeId(normalized.module, normalized.name)
  let suffix = 2
  while (true) {
    const existingRows = (await sql`
      select 1 from badges where id = ${id} limit 1
    `) as { "?column?": number }[]
    if (existingRows.length === 0) break
    id = `${makeBadgeId(normalized.module, normalized.name)}-${suffix}`
    suffix += 1
  }

  const rows = (await sql`
    insert into badges (
      id,
      name,
      module,
      group_name,
      level_type_id,
      level,
      condition,
      where_it_appears,
      design_link,
      status,
      sort_order
    )
    values (
      ${id},
      ${normalized.name},
      ${normalized.module},
      ${normalized.group},
      ${normalized.levelTypeId},
      ${normalized.level},
      ${normalized.condition},
      ${normalized.whereItAppears},
      ${normalized.designLink},
      'active',
      9999
    )
    returning
      id,
      name,
      module,
      group_name,
      level_type_id,
      level,
      condition,
      where_it_appears,
      design_link,
      status,
      sort_order
  `) as BadgeRow[]

  return mapBadge(rows[0])
}

export async function updateBadge(badgeId: string, input: BadgeDraft) {
  await ensureBadgeSeeded()
  const normalized = normalizeBadgeInput(input)
  await assertLevelInput(normalized.levelTypeId, normalized.level)

  const rows = (await sql`
    update badges
    set
      name = ${normalized.name},
      module = ${normalized.module},
      group_name = ${normalized.group},
      level_type_id = ${normalized.levelTypeId},
      level = ${normalized.level},
      condition = ${normalized.condition},
      where_it_appears = ${normalized.whereItAppears},
      design_link = ${normalized.designLink},
      updated_at = now()
    where id = ${badgeId}
      and status <> 'archived'
    returning
      id,
      name,
      module,
      group_name,
      level_type_id,
      level,
      condition,
      where_it_appears,
      design_link,
      status,
      sort_order
  `) as BadgeRow[]

  const row = rows[0]
  if (!row) throw new Error("Badge not found.")
  return mapBadge(row)
}

export async function archiveBadge(badgeId: string) {
  await ensureBadgeSeeded()
  const rows = (await sql`
    update badges
    set status = 'archived', updated_at = now()
    where id = ${badgeId}
      and status <> 'archived'
    returning id
  `) as { id: string }[]

  if (rows.length === 0) throw new Error("Badge not found.")
}

export async function updateBadgeDisplayRanking(
  contextId: string,
  ranking: BadgeRankingConfig[]
) {
  await ensureBadgeSeeded()

  const contextRows = (await sql`
    select 1 from badge_display_contexts where id = ${contextId} limit 1
  `) as { "?column?": number }[]
  if (contextRows.length === 0) throw new Error("Display context not found.")

  const badgeIds = new Set<string>()
  for (const item of ranking) {
    if (!item.badgeId) throw new Error("Badge is required.")
    if (badgeIds.has(item.badgeId)) {
      throw new Error(`Duplicate badge in ranking: ${item.badgeId}`)
    }
    badgeIds.add(item.badgeId)
  }

  for (const item of ranking) {
    const badgeRows = (await sql`
      select 1
      from badges
      where id = ${item.badgeId}
        and status <> 'archived'
      limit 1
    `) as { "?column?": number }[]
    if (badgeRows.length === 0) {
      throw new Error(`Badge not found: ${item.badgeId}`)
    }
  }

  await sql`
    delete from badge_display_rankings
    where context_id = ${contextId}
  `

  for (const [index, item] of ranking.entries()) {
    await sql`
      insert into badge_display_rankings (
        context_id,
        badge_id,
        active,
        priority,
        updated_at
      )
      values (
        ${contextId},
        ${item.badgeId},
        ${Boolean(item.active)},
        ${index + 1},
        now()
      )
    `
  }

  return getBadgeManagementWorkspace()
}
