"use server"

import { revalidatePath } from "next/cache"
import { sql } from "@/lib/db/neon"

export async function toggleBoothTemplatePublic(templateId: string) {
  const rows =
    await sql`update booth_templates set is_public = not is_public, updated_at = now() where id = ${templateId} returning id`
  if (rows.length === 0) {
    throw new Error("Booth template not found")
  }
  revalidatePath("/admin/tradexpo/booth-templates")
  revalidatePath(`/admin/tradexpo/booth-templates/${templateId}`)
}

export async function toggleBoothTemplateActive(templateId: string) {
  const rows =
    await sql`update booth_templates set is_active = not is_active, updated_at = now() where id = ${templateId} returning id`
  if (rows.length === 0) {
    throw new Error("Booth template not found")
  }
  revalidatePath("/admin/tradexpo/booth-templates")
  revalidatePath(`/admin/tradexpo/booth-templates/${templateId}`)
}
