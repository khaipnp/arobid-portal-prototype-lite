import { randomUUID } from "node:crypto"
import { sql } from "@/lib/db/neon"
import { createAuthSession } from "./session"

export async function quickRegisterBuyer(fullName: string, email: string) {
  const normalizedEmail = email.toLowerCase().trim()

  // Check if user already exists
  const existingUser = (await sql`
    select id from users where lower(email) = ${normalizedEmail} limit 1
  `) as { id: string }[]

  let userId: string
  if (existingUser.length > 0) {
    userId = existingUser[0].id
  } else {
    userId = randomUUID()
    await sql`
      insert into users (id, name, email, company, is_active)
      values (${userId}, ${fullName}, ${normalizedEmail}, 'Guest Buyer', true)
    `
    await sql`
      insert into user_roles (user_id, role_id)
      values (${userId}, 'buyer')
    `
  }

  await createAuthSession(userId)
  return userId
}
