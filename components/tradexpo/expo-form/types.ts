import type {
  Expo,
  ExpoCategory,
  ExpoHall,
  ExpoLayoutTemplate,
  ExpoMarketingContent,
  HallTemplate
} from "@/lib/tradexpo/types"

export type HallFormRow = {
  key: string
  hallName: string
  hallTemplateId: string
  basicQty: number
  professionalQty: number
  premiumQty: number
}

export type OwnerPick = { id: string; email: string; name: string }

export type OwnerDisplay = { label: string; email: string }

export type AudienceCardFormRow =
  ExpoMarketingContent["whoShouldJoin"]["audienceCards"][number] & {
    key: string
  }

export type BenefitCardFormRow =
  ExpoMarketingContent["audienceBenefits"]["benefitCards"][number] & {
    key: string
  }

export type ExpoFormStepId =
  | "general"
  | "schedule"
  | "owner"
  | "halls"
  | "marketing"

export type ExpoFormStep = {
  id: ExpoFormStepId
  title: string
  description: string
}

export type ExpoFormProps = {
  categories: ExpoCategory[]
  layoutTemplates: ExpoLayoutTemplate[]
  hallTemplates: HallTemplate[]
  cancelHref?: string
  successHref?: string
  submitEndpoint?: string
  editableScope?: "admin" | "partner-content"
  isSuper?: boolean
  initialMarketingContent?: ExpoMarketingContent
} & (
  | { mode: "create" }
  | {
      mode: "edit"
      expoId: string
      initialExpo: Expo
      initialHalls: ExpoHall[]
      initialOwner: OwnerPick | null
    }
)
