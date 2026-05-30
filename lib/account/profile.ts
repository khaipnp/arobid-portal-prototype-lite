import { sql } from "@/lib/db/neon"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const ACCOUNT_PROFILE_GENDERS = [
  "male",
  "female",
  "other",
  "prefer_not_to_say"
] as const

export type AccountProfileGender = (typeof ACCOUNT_PROFILE_GENDERS)[number]

export type AccountProfile = {
  firstName: string
  lastName: string
  gender: AccountProfileGender | null
  mobile: string | null
  dateOfBirth: string | null
}

export type UpdateAccountProfileInput = {
  firstName?: unknown
  lastName?: unknown
  gender?: unknown
  mobile?: unknown
  dateOfBirth?: unknown
  [key: string]: unknown
}

type AccountProfileRow = {
  name: string
  first_name: string | null
  last_name: string | null
  gender: string | null
  mobile: string | null
  date_of_birth: string | null
}

export function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

export function normalizeNullableText(value: unknown) {
  const text = normalizeText(value)
  return text.length > 0 ? text : null
}

export function splitDisplayName(displayName: unknown) {
  const name = normalizeText(displayName)
  if (!name) {
    return { firstName: "", lastName: "" }
  }

  const [firstName = "", ...rest] = name.split(/\s+/)
  return { firstName, lastName: rest.join(" ") }
}

export function isAccountProfileGender(
  value: unknown
): value is AccountProfileGender {
  return (ACCOUNT_PROFILE_GENDERS as readonly unknown[]).includes(value)
}

export function normalizeGender(value: unknown) {
  const gender = normalizeNullableText(value)
  return isAccountProfileGender(gender) ? gender : null
}

export function normalizeDateOfBirth(value: unknown) {
  if (value == null) {
    return null
  }

  if (typeof value !== "string") {
    throw new Error("Date of birth must use YYYY-MM-DD format.")
  }

  const dateOfBirth = normalizeNullableText(value)
  if (!dateOfBirth) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    throw new Error("Date of birth must use YYYY-MM-DD format.")
  }

  const [yearText, monthText, dayText] = dateOfBirth.split("-")
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(Date.UTC(year, month - 1, day))

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error("Date of birth must be a real date.")
  }

  return dateOfBirth
}

export function toAccountProfile(row: AccountProfileRow): AccountProfile {
  const fallback = splitDisplayName(row.name)
  const firstName = normalizeText(row.first_name) || fallback.firstName
  const lastName = normalizeText(row.last_name) || fallback.lastName

  return {
    firstName,
    lastName,
    gender: normalizeGender(row.gender),
    mobile: normalizeNullableText(row.mobile),
    dateOfBirth: normalizeDateOfBirth(row.date_of_birth)
  }
}

function normalizeUpdateInput(input: UpdateAccountProfileInput) {
  const firstName = normalizeText(input.firstName)
  const lastName = normalizeText(input.lastName)

  if (!firstName) {
    throw new Error("First name is required.")
  }

  if (!lastName) {
    throw new Error("Last name is required.")
  }

  if (input.gender != null && typeof input.gender !== "string") {
    throw new Error("Gender must be male, female, other, or prefer_not_to_say.")
  }

  const genderText = normalizeNullableText(input.gender)
  if (genderText && !isAccountProfileGender(genderText)) {
    throw new Error("Gender must be male, female, other, or prefer_not_to_say.")
  }

  return {
    firstName,
    lastName,
    gender: genderText,
    mobile: normalizeNullableText(input.mobile),
    dateOfBirth: normalizeDateOfBirth(input.dateOfBirth)
  }
}

export async function getAccountProfile(userId: string) {
  await ensurePlatformSchema()

  const rows = (await sql`
    select
      name,
      first_name,
      last_name,
      gender,
      mobile,
      date_of_birth::text
    from users
    where id = ${userId}
      and is_active = true
    limit 1
  `) as AccountProfileRow[]

  const row = rows[0]
  if (!row) {
    throw new Error("Account profile not found.")
  }

  return toAccountProfile(row)
}

export async function updateAccountProfile(
  userId: string,
  input: UpdateAccountProfileInput
) {
  await ensurePlatformSchema()

  const profile = normalizeUpdateInput(input)
  const displayName = `${profile.firstName} ${profile.lastName}`.trim()

  const rows = (await sql`
    update users
    set
      name = ${displayName},
      first_name = ${profile.firstName},
      last_name = ${profile.lastName},
      gender = ${profile.gender},
      mobile = ${profile.mobile},
      date_of_birth = nullif(${profile.dateOfBirth ?? ""}, '')::date
    where id = ${userId}
      and is_active = true
    returning
      name,
      first_name,
      last_name,
      gender,
      mobile,
      date_of_birth::text
  `) as AccountProfileRow[]

  const row = rows[0]
  if (!row) {
    throw new Error("Account profile not found.")
  }

  return toAccountProfile(row)
}
