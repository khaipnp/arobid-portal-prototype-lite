import { NextResponse } from "next/server"

import { getCurrentSessionUserId } from "@/lib/auth/session"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { listExpoDetailExhibitorsByName } from "@/lib/tradexpo/db/platform-data"

export async function GET(request: Request) {
  await ensurePlatformSchema()
  const url = new URL(request.url)
  const expoName = (url.searchParams.get("expoName") ?? "").trim()
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase()
  const category = (url.searchParams.get("category") ?? "").trim().toLowerCase()

  if (!expoName) {
    return NextResponse.json({ error: "expoName is required" }, { status: 400 })
  }

  const userId = await getCurrentSessionUserId()
  const rows = await listExpoDetailExhibitorsByName(expoName, { userId })
  const filtered = rows.filter((item) => {
    const matchedSearch =
      !search ||
      item.company.toLowerCase().includes(search) ||
      item.name.toLowerCase().includes(search)
    const matchedCategory =
      !category || item.category.toLowerCase() === category
    return matchedSearch && matchedCategory
  })

  return NextResponse.json({ data: filtered })
}
