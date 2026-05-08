import { NextResponse } from "next/server"

import { listExpoDetailExhibitorsByName } from "@/lib/tradexpo/db/platform-data"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const expoName = (url.searchParams.get("expoName") ?? "").trim()
  const search = (url.searchParams.get("search") ?? "").trim().toLowerCase()
  const category = (url.searchParams.get("category") ?? "").trim().toLowerCase()

  if (!expoName) {
    return NextResponse.json({ error: "expoName is required" }, { status: 400 })
  }

  const rows = await listExpoDetailExhibitorsByName(expoName)
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
