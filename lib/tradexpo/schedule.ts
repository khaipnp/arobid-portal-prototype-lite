import type {
  Expo,
  ExpoSchedulePrecision,
  ExpoTimelinePhase
} from "@/lib/tradexpo/types"

export const EXPO_SCHEDULE_PRECISIONS: ExpoSchedulePrecision[] = [
  "exact_date_range",
  "month_year",
  "unscheduled"
]

export const EXPO_MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" }
]

export type ExpoScheduleInput = {
  schedulePrecision?: string
  startAt?: string
  endAt?: string
  timezone?: string
  scheduleMonth?: number | string | null
  scheduleYear?: number | string | null
}

export type NormalizedExpoSchedule = {
  schedulePrecision: ExpoSchedulePrecision
  startAt: string | null
  endAt: string | null
  timezone: string
  scheduleMonth: number | null
  scheduleYear: number | null
}

export type NormalizeExpoScheduleOptions = {
  requireFutureStart?: boolean
  nowMs?: number
}

function parseSchedulePrecision(
  value: string | undefined
): ExpoSchedulePrecision {
  if (value === "exact_date_range") return "exact_date_range"
  if (value === "month_year") return "month_year"
  if (value === "unscheduled") return "unscheduled"
  return "unscheduled"
}

function parseInteger(value: number | string | null | undefined) {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim()) {
    return Number.parseInt(value.trim(), 10)
  }
  return Number.NaN
}

function isValidEventYear(value: number) {
  return Number.isInteger(value) && value >= 1900 && value <= 9999
}

export function normalizeExpoScheduleInput(
  input: ExpoScheduleInput,
  options: NormalizeExpoScheduleOptions = {}
):
  | { ok: true; schedule: NormalizedExpoSchedule }
  | { ok: false; error: string } {
  const schedulePrecision = parseSchedulePrecision(input.schedulePrecision)
  const timezone = input.timezone?.trim() || "Asia/Bangkok"

  if (schedulePrecision === "exact_date_range") {
    const startAt = input.startAt?.trim() ?? ""
    const endAt = input.endAt?.trim() ?? ""
    if (!startAt || !endAt) {
      return { ok: false, error: "Start and end date/time are required." }
    }

    const start = new Date(startAt)
    const end = new Date(endAt)
    const startMs = start.getTime()
    const endMs = end.getTime()
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      return { ok: false, error: "Invalid start or end date/time." }
    }
    if (endMs <= startMs) {
      return { ok: false, error: "End must be after start." }
    }
    if (options.requireFutureStart) {
      const checkNow = options.nowMs ?? Date.now()
      if (startMs < checkNow - 60_000) {
        return {
          ok: false,
          error: "Start date/time cannot be in the past."
        }
      }
    }

    return {
      ok: true,
      schedule: {
        schedulePrecision,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        timezone,
        scheduleMonth: null,
        scheduleYear: null
      }
    }
  }

  if (schedulePrecision === "month_year") {
    const scheduleMonth = parseInteger(input.scheduleMonth)
    const scheduleYear = parseInteger(input.scheduleYear)
    if (
      !Number.isInteger(scheduleMonth) ||
      scheduleMonth < 1 ||
      scheduleMonth > 12
    ) {
      return { ok: false, error: "Select a valid schedule month." }
    }
    if (!isValidEventYear(scheduleYear)) {
      return {
        ok: false,
        error: "Enter a valid four-digit schedule year."
      }
    }

    return {
      ok: true,
      schedule: {
        schedulePrecision,
        startAt: null,
        endAt: null,
        timezone,
        scheduleMonth,
        scheduleYear
      }
    }
  }

  return {
    ok: true,
    schedule: {
      schedulePrecision: "unscheduled",
      startAt: null,
      endAt: null,
      timezone,
      scheduleMonth: null,
      scheduleYear: null
    }
  }
}

export function getExpoSchedulePrecision(expo: Partial<Expo>) {
  if (expo.schedulePrecision) return expo.schedulePrecision
  if (expo.startAt && expo.endAt)
    return "exact_date_range" satisfies ExpoSchedulePrecision
  return "unscheduled" satisfies ExpoSchedulePrecision
}

export function getExpoTimelinePhase(
  nowMs: number,
  schedulePrecision: ExpoSchedulePrecision,
  startAtIso?: string | null,
  endAtIso?: string | null
): ExpoTimelinePhase {
  if (schedulePrecision !== "exact_date_range" || !startAtIso || !endAtIso) {
    return "Upcoming"
  }

  const start = new Date(startAtIso).getTime()
  const end = new Date(endAtIso).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return "Upcoming"
  if (nowMs < start) return "Upcoming"
  if (nowMs > end) return "Archived"
  return "Live"
}

export type ExpoScheduleDisplay = Pick<
  Expo,
  | "schedulePrecision"
  | "scheduleMonth"
  | "scheduleYear"
  | "startDate"
  | "endDate"
  | "startAt"
  | "endAt"
>

export function formatExpoScheduleLabel(expo: ExpoScheduleDisplay) {
  const precision = getExpoSchedulePrecision(expo)
  if (precision === "exact_date_range") {
    if (expo.startDate && expo.endDate) {
      return `${expo.startDate} → ${expo.endDate}`
    }
    return "Exact schedule not set"
  }
  if (precision === "month_year") {
    const month = EXPO_MONTH_OPTIONS.find(
      (option) => option.value === expo.scheduleMonth
    )
    return month && expo.scheduleYear
      ? `${month.label} ${expo.scheduleYear}`
      : "Month & year not set"
  }
  return "Schedule to be announced"
}
