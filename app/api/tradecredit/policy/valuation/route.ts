import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { createCreditValuation } from "@/lib/tradecredit/db"

export async function POST(request: Request) {
  await ensurePlatformSchema()

  try {
    const adminActorId = await requireRole("admin")
    const body = (await request.json()) as {
      creditValueVnd?: unknown
      effectiveAt?: unknown
      reasonNote?: unknown
    }
    const reasonNote =
      typeof body.reasonNote === "string" ? body.reasonNote.trim() : ""
    if (!reasonNote) {
      return NextResponse.json(
        { error: "Reason note is required." },
        { status: 400 }
      )
    }

    const valuation = await createCreditValuation({
      creditValueVnd: Number(body.creditValueVnd),
      effectiveAt:
        typeof body.effectiveAt === "string" && body.effectiveAt.trim()
          ? body.effectiveAt
          : new Date().toISOString(),
      reasonNote,
      adminActorId
    })

    return NextResponse.json({ valuation }, { status: 201 })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update valuation."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
