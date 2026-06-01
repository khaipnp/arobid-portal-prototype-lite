import { BadgeCheckIcon, GemIcon, RocketIcon } from "lucide-react"
import type {
  ExpoMarketingIconKey,
  ExpoSchedulePrecision
} from "@/lib/tradexpo/types"
import type { ExpoFormStep } from "./types"

export const MARKETING_ICON_OPTIONS: Array<{
  value: ExpoMarketingIconKey
  label: string
  Icon: typeof BadgeCheckIcon
}> = [
  { value: "badge", label: "Badge", Icon: BadgeCheckIcon },
  { value: "rocket", label: "Rocket", Icon: RocketIcon },
  { value: "gem", label: "Gem", Icon: GemIcon }
]

export const SCHEDULE_PRECISION_OPTIONS: Array<{
  value: ExpoSchedulePrecision
  label: string
  description: string
}> = [
  {
    value: "exact_date_range",
    label: "Exact date range",
    description: "Use confirmed start and end date/time."
  },
  {
    value: "month_year",
    label: "Month & year",
    description: "Use event month and year while exact dates are pending."
  },
  {
    value: "unscheduled",
    label: "To be announced",
    description: "Create this Expo without schedule fields."
  }
]

export const ADMIN_EXPO_FORM_STEPS: ExpoFormStep[] = [
  {
    id: "general",
    title: "General information",
    description: "Name, description, image and category"
  },
  {
    id: "schedule",
    title: "Schedule information",
    description: "Schedule precision and event dates"
  },
  {
    id: "owner",
    title: "Expo owner",
    description: "Expo owner and operator information"
  },
  {
    id: "halls",
    title: "Hall configuration",
    description: "Hall, template and booth quantity configuration"
  },
  {
    id: "marketing",
    title: "Marketing content",
    description: "Marketing content for the Expo landing page"
  }
]

export const PARTNER_EXPO_FORM_STEPS = ADMIN_EXPO_FORM_STEPS.filter(
  (step) => step.id !== "owner" && step.id !== "halls"
)
