import { NextResponse } from "next/server"
import { searchExpoOwnersByEmail } from "@/lib/tradexpo/db/platform-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") ?? ""
  const users = await searchExpoOwnersByEmail(q)
  return NextResponse.json({ users })
}
