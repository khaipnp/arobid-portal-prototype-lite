import { neon } from "@neondatabase/serverless"

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error(
      "Missing DATABASE_URL. Set a Neon Postgres connection string in your environment variables.",
    )
  }
  return url
}

export const sql = neon(getDatabaseUrl())
