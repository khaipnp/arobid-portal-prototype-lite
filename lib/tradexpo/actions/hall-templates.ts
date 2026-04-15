"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db/neon"

export async function toggleHallTemplatePublic(templateId: string) {
  const rows =
    await sql`update hall_templates set is_public = not is_public, updated_at = now() where id = ${templateId} returning id`
  if (rows.length === 0) {
    throw new Error("Hall template not found")
  }
  revalidatePath("/admin/tradexpo/hall-templates")
  revalidatePath(`/admin/tradexpo/hall-templates/${templateId}`)
}

export async function toggleHallTemplateActive(templateId: string) {
  const rows =
    await sql`update hall_templates set is_active = not is_active, updated_at = now() where id = ${templateId} returning id`
  if (rows.length === 0) {
    throw new Error("Hall template not found")
  }
  revalidatePath("/admin/tradexpo/hall-templates")
  revalidatePath(`/admin/tradexpo/hall-templates/${templateId}`)
}
