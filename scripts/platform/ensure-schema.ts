import { resolve } from "node:path"
import { config } from "dotenv"

config({ path: resolve(process.cwd(), ".env.local") })
config({ path: resolve(process.cwd(), ".env") })

const { ensurePlatformSchema } = await import("@/lib/platform/ensure-schema")

console.log("Ensuring platform schema...")
await ensurePlatformSchema()
console.log("Platform schema ready.")
