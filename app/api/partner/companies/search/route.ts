import { NextResponse } from "next/server"
import { requirePartnerApiAction } from "@/lib/partner/access"
import { searchPartnerCompanies } from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET(request: Request) {
  await ensurePlatformSchema()
  try {
    const userId = await requirePartnerApiAction("enterprise.manage")
    const { searchParams } = new URL(request.url)
    const companies = await searchPartnerCompanies(
      userId,
      searchParams.get("q") ?? ""
    )
    return NextResponse.json({ companies })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed."
    const status = message === "Forbidden." ? 403 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
