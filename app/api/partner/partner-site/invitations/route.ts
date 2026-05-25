import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import {
  createPartnerSiteInvitations,
  type PartnerSiteInvitationType
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function parseRecipientEmails(value: string) {
  const emails = value
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
  const uniqueEmails = Array.from(new Set(emails))
  const invalid = uniqueEmails.filter((email) => !emailPattern.test(email))

  return { emails: uniqueEmails, invalid }
}

export async function POST(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("invite.manage")
    const body = (await request.json()) as {
      invitationType?: PartnerSiteInvitationType
      recipientText?: string
    }
    const invitationType = body.invitationType ?? "join_partner_site"
    if (
      invitationType !== "site_visit" &&
      invitationType !== "join_partner_site"
    ) {
      return NextResponse.json(
        { error: "Invalid invitation type." },
        { status: 400 }
      )
    }

    const { emails, invalid } = parseRecipientEmails(body.recipientText ?? "")
    if (emails.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient email is required." },
        { status: 400 }
      )
    }
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `Invalid email: ${invalid.join(", ")}` },
        { status: 400 }
      )
    }

    const result = await createPartnerSiteInvitations(userId, {
      invitationType,
      recipients: emails
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Send failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
