import { config as loadEnv } from "dotenv"
import { defineConfig, env } from "prisma/config"

loadEnv({ path: ".env.local" })
loadEnv()

type Env = {
  DATABASE_URL: string
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "bun prisma/seed.ts",
  },
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
})

