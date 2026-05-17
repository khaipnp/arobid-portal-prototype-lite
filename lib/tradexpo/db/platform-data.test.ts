import { describe, expect, test } from "bun:test"

describe("rowToExpo", () => {
  test("uses a fallback thumbnail URL when database value is empty", async () => {
    process.env.DATABASE_URL ??= "postgres://user:pass@localhost/db"
    const { rowToExpo } = await import("@/lib/tradexpo/db/platform-data")

    const expo = rowToExpo({
      id: "expo-empty-thumb",
      name: "Empty Thumb Expo",
      thumbnail_url: "",
      owner_email: "owner@example.com",
      start_date: "2026-06-01",
      end_date: "2026-06-03",
      status: "Draft",
      category_ids: [],
      created_at: "2026-05-16T00:00:00.000Z"
    })

    expect(expo.thumbnailUrl).toBe(
      "https://picsum.photos/seed/expo-empty-thumb/640/360"
    )
  })
})
