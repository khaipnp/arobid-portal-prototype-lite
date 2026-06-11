import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  type PartnerSiteInvitationRecipientSource,
  validatePartnerSiteInvitationRecipients
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

function isRecipientSource(
  value: unknown
): value is PartnerSiteInvitationRecipientSource {
  return value === "manual" || value === "import"
}

function toRecipientArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string")
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const body = (await request.json()) as {
      recipients?: unknown
      source?: unknown
    }
    const preview = await validatePartnerSiteInvitationRecipients(userId, {
      recipients: toRecipientArray(body.recipients),
      source: isRecipientSource(body.source) ? body.source : "manual"
    })

    return NextResponse.json(preview)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Validation failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
