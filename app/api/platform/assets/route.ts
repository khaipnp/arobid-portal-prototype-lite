import { NextResponse } from "next/server"
import { sql } from "@/lib/db/neon"

/**
 * POST /api/platform/assets
 * Lưu metadata của tệp đã upload thành công vào Neon DB.
 */
export async function POST(req: Request) {
  try {
    const { assetId, fileName, fileUrl, kind, metadata } = await req.json()

    if (!fileName || !fileUrl || !kind) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      )
    }

    const id = assetId || crypto.randomUUID()

    await sql`
      insert into assets (
        asset_id, file_name, file_url, kind, status, metadata, created_at
      ) values (
        ${id}, ${fileName}, ${fileUrl}, ${kind}, 'ready', ${metadata || {}}, now()
      )
    `

    return NextResponse.json({ success: true, assetId: id })
  } catch (error) {
    console.error("Error saving asset metadata:", error)
    return NextResponse.json(
      { error: "Failed to save asset metadata" },
      { status: 500 },
    )
  }
}
