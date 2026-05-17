import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"

export type ExpoAnalyticsPayload = {
  expoId: string
  exhibitorId: string
  productId?: string | null
  conversationId?: string | null
  visitorKey?: string | null
  requesterKey?: string | null
  userId?: string | null
}

function cleanText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

export function parseExpoAnalyticsPayload(
  value: unknown
): ExpoAnalyticsPayload {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid analytics payload.")
  }

  const record = value as Record<string, unknown>
  const expoId = cleanText(record.expoId)
  const exhibitorId = cleanText(record.exhibitorId)

  if (!expoId || !exhibitorId) {
    throw new Error("expoId and exhibitorId are required.")
  }

  return {
    expoId,
    exhibitorId,
    productId: cleanText(record.productId),
    conversationId: cleanText(record.conversationId),
    visitorKey: cleanText(record.visitorKey),
    requesterKey: cleanText(record.requesterKey)
  }
}

export async function recordExpoProfileView(input: ExpoAnalyticsPayload) {
  await sql`
    insert into expo_exhibitor_profile_visits (
      id, expo_id, exhibitor_id, visitor_user_id, visitor_key
    ) values (
      ${`expo-profile-visit-${randomUUID()}`},
      ${input.expoId},
      ${input.exhibitorId},
      ${input.userId ?? null},
      ${input.visitorKey ?? null}
    )
  `
}

export async function recordExpoProductView(input: ExpoAnalyticsPayload) {
  if (!input.productId) throw new Error("productId is required.")
  await sql`
    insert into expo_exhibitor_product_views (
      id, expo_id, exhibitor_id, product_id, visitor_user_id, visitor_key
    ) values (
      ${`expo-product-view-${randomUUID()}`},
      ${input.expoId},
      ${input.exhibitorId},
      ${input.productId},
      ${input.userId ?? null},
      ${input.visitorKey ?? null}
    )
  `
}

export async function recordExpoProductChat(input: ExpoAnalyticsPayload) {
  await sql`
    insert into expo_exhibitor_product_chat_events (
      id, expo_id, exhibitor_id, product_id, conversation_id, visitor_user_id, visitor_key
    ) values (
      ${`expo-product-chat-${randomUUID()}`},
      ${input.expoId},
      ${input.exhibitorId},
      ${input.productId ?? null},
      ${input.conversationId ?? null},
      ${input.userId ?? null},
      ${input.visitorKey ?? null}
    )
  `
}

export async function recordExpoRfq(input: ExpoAnalyticsPayload) {
  await sql`
    insert into expo_exhibitor_rfq_events (
      id, expo_id, exhibitor_id, product_id, requester_user_id, requester_key
    ) values (
      ${`expo-rfq-${randomUUID()}`},
      ${input.expoId},
      ${input.exhibitorId},
      ${input.productId ?? null},
      ${input.userId ?? null},
      ${input.requesterKey ?? input.visitorKey ?? null}
    )
  `
}
