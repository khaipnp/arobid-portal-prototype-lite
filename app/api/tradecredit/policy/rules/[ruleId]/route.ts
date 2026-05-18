import { NextResponse } from "next/server"
import { requireRole } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { updateCreditRule } from "@/lib/tradecredit/db"

type Props = {
  params: Promise<{ ruleId: string }>
}

export async function PATCH(request: Request, { params }: Props) {
  await ensurePlatformSchema()

  try {
    const adminActorId = await requireRole("admin")
    const { ruleId } = await params
    const body = (await request.json()) as {
      isEnabled?: unknown
      creditQuantity?: unknown
    }

    if (typeof body.isEnabled !== "boolean") {
      return NextResponse.json(
        { error: "Rule status is required." },
        { status: 400 }
      )
    }

    const rule = await updateCreditRule({
      ruleId,
      isEnabled: body.isEnabled,
      creditQuantity: Number(body.creditQuantity),
      adminActorId
    })

    return NextResponse.json({ rule })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update rule."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
