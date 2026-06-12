import { NextResponse } from "next/server"
import { getBadgeManagementWorkspace } from "@/lib/badges/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export async function GET() {
  try {
    await ensurePlatformSchema()
    const workspace = await getBadgeManagementWorkspace()
    return NextResponse.json({ displayContexts: workspace.displayContexts })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Display context request failed."
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
