/** Shared helpers for create/edit expo forms. */

export const EXPO_FORM_TIMEZONES = [
  { value: "Asia/Bangkok", label: "GMT+7 — Asia/Bangkok" },
  { value: "Asia/Ho_Chi_Minh", label: "GMT+7 — Asia/Ho Chi Minh" },
  { value: "Asia/Singapore", label: "GMT+8 — Asia/Singapore" },
  { value: "UTC", label: "UTC" }
]

export function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
