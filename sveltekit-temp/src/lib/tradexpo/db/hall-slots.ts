import { sql } from "$lib/db/neon"
import type { HallSlotUsage, HallTemplateSlot } from "$lib/tradexpo/types"

export async function listHallTemplateSlots(
  templateId: string
): Promise<HallTemplateSlot[]> {
  const rows =
    await sql`select * from hall_template_slots where hall_template_id = ${templateId} order by slot_code asc`

  return rows.map((r) => ({
    id: r.id,
    hallTemplateId: r.hall_template_id,
    slotCode: r.slot_code,
    name: r.name,
    posX: r.pos_x,
    posY: r.pos_y,
    posZ: r.pos_z,
    rotX: r.rot_x,
    rotY: r.rot_y,
    rotZ: r.rot_z,
    scaleX: r.scale_x,
    scaleY: r.scale_y,
    scaleZ: r.scale_z,
    width: r.width,
    height: r.height,
    depth: r.depth,
    metadata: r.metadata ?? {}
  }))
}

export async function listHallSlotUsage(
  templateId: string
): Promise<HallSlotUsage[]> {
  const rows = await sql`
    select u.*
    from hall_slot_usage u
    join hall_template_slots s on s.id = u.slot_id
    where s.hall_template_id = ${templateId}
  `

  return rows.map((r) => ({
    slotId: r.slot_id,
    upcomingExpoCount: r.upcoming_expo_count,
    liveExpoCount: r.live_expo_count
  }))
}
