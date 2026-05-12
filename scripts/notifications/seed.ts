/**
 * Seed sample rows into `notifications` via `publishNotification`.
 * Requires DATABASE_URL (Neon). Loads `.env.local` / `.env` like other platform scripts.
 *
 * Usage:
 *   bun scripts/notifications/seed.ts
 *   NOTIFICATION_SEED_USERS=user-current bun scripts/notifications/seed.ts
 */

import { resolve } from "node:path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

const DEFAULT_USERS = [
  "11111111-1111-4111-8111-111111111111", // user-current
  "88888888-8888-4888-8888-888888888888" // partner-1 (demo partner account)
] as const

function parseUserList(): string[] {
  const raw = process.env.NOTIFICATION_SEED_USERS?.trim()
  if (!raw) {
    return [...DEFAULT_USERS]
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

type SeedItem = {
  source: string
  type: string
  title: string
  body: string
  deepLinkPath: string
  referenceId?: string
  referenceType?: string
}

const USER_WORKSPACE_SEEDS: SeedItem[] = [
  {
    source: "chat",
    type: "dm",
    title: "New message in Deal Room",
    body: "Alex sent you a message about the spring expo booth.",
    deepLinkPath: "/seller/deal-room"
  },
  {
    source: "tradexpo",
    type: "expo_reminder",
    title: "Expo starts in 3 days",
    body: "Check your booth checklist before the hall opens.",
    deepLinkPath: "/seller/my-expos",
    referenceId: "seed-expo-user-current",
    referenceType: "expo"
  },
  {
    source: "orders",
    type: "order_update",
    title: "Order confirmed",
    body: "Your booth add-on order was confirmed. View details anytime.",
    deepLinkPath: "/seller/orders",
    referenceId: "seed-order-1",
    referenceType: "order"
  },
  {
    source: "payment",
    type: "payout",
    title: "Payout scheduled",
    body: "A payout to your bank account is scheduled for next week.",
    deepLinkPath: "/seller/host-dashboard"
  }
]

const PARTNER_SEEDS: SeedItem[] = [
  {
    source: "tradexpo",
    type: "registration",
    title: "New exhibitor application",
    body: "An exhibitor submitted an application for your expo.",
    deepLinkPath: "/partner/expos",
    referenceId: "seed-app-1",
    referenceType: "registration"
  },
  {
    source: "chat",
    type: "mention",
    title: "You were mentioned",
    body: "Operations tagged you in a conversation about hall layout.",
    deepLinkPath: "/partner/expos"
  },
  {
    source: "tradexpo",
    type: "go_live",
    title: "Stream session ended",
    body: "Your GoLIVE recap and viewer stats are ready to review.",
    deepLinkPath: "/partner/expos",
    referenceId: "seed-stream-1",
    referenceType: "stream"
  }
]

function seedsForUser(userId: string): SeedItem[] {
  if (userId === "88888888-8888-4888-8888-888888888888") {
    return PARTNER_SEEDS
  }
  if (userId === "11111111-1111-4111-8111-111111111111") {
    return USER_WORKSPACE_SEEDS
  }
  // Default: small generic set (valid paths)
  return [
    {
      source: "tradexpo",
      type: "system",
      title: "Welcome",
      body: "Notification seed for this user. Adjust scripts/notifications/seed.ts.",
      deepLinkPath: "/"
    }
  ]
}

async function main() {
  const { ensurePlatformSchema } = await import("@/lib/platform/ensure-schema")
  const { sql } = await import("@/lib/db/neon")
  const { publishNotification } = await import("@/lib/notifications/service")

  await ensurePlatformSchema()

  const userIds = parseUserList()
  if (userIds.length === 0) {
    console.error("No user ids to seed.")
    process.exit(1)
  }

  for (const id of userIds) {
    await sql`
      delete from notifications
      where user_id = ${id}
    `
  }

  let inserted = 0
  for (const userId of userIds) {
    const items = seedsForUser(userId)
    for (const item of items) {
      const result = await publishNotification({
        userId,
        ...item
      })
      if (!result.deduped) {
        inserted += 1
      }
      await new Promise((r) => setTimeout(r, 15))
    }
  }

  console.log(
    `Seeded notifications for: ${userIds.join(", ")} (new rows: ${inserted}).`
  )
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
