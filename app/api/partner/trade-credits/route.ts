import { NextResponse } from "next/server"
import { getCurrentUserIdFromRequest, userHasRole } from "@/lib/auth/rbac"
import { recordPartnerTradeCreditEntry } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

async function requirePartnerUser() {
  const userId = await getCurrentUserIdFromRequest()
  const allowed = await userHasRole(userId, "partner")
  if (!allowed) throw new Error("Forbidden.")
  return userId
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerUser()
    const body = (await request.json()) as {
      entryType?: "purchase" | "allocate" | "consume" | "release"
      amount?: number
      enterpriseMemberId?: string | null
      note?: string | null
    }
    if (
      body.entryType !== "purchase" &&
      body.entryType !== "allocate" &&
      body.entryType !== "consume" &&
      body.entryType !== "release"
    ) {
      return NextResponse.json(
        { error: "Invalid ledger entry type." },
        { status: 400 }
      )
    }

    const result = await recordPartnerTradeCreditEntry(userId, {
      entryType: body.entryType,
      amount: Number(body.amount),
      enterpriseMemberId: body.enterpriseMemberId || null,
      note: body.note ?? null
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Record failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
