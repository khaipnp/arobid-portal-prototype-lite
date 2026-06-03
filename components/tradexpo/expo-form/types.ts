import type {
  Expo,
  ExpoCategory,
  ExpoHall,
  ExpoLayoutTemplate,
  ExpoMarketingContent,
  ExpoPackageDisplay,
  ExpoPackageFormWorkspace,
  ExpoTenantOption,
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

export type OwnerPick = {
  id: string
  email: string
  name: string
  imageUrl?: string | null
}

export type OwnerDisplay = {
  label: string
  email: string
  imageUrl?: string | null
}

export type AudienceCardFormRow =
  ExpoMarketingContent["whoShouldJoin"]["audienceCards"][number] & {
    key: string
  }

export type BenefitCardFormRow =
  ExpoMarketingContent["audienceBenefits"]["benefitCards"][number] & {
    key: string
  }

export type ExpoPackageFormRow = {
  key: string
  id?: string
  mode: "link_existing" | "create_new"
  packageDefinitionId?: string
  name: string
  description: string
  price: string
  priceUnit: string
  benefits: string[]
  isFeatured: boolean
  isPublic: boolean
  advanced: {
    planId: string
    roleCode: string
  }
}

export type ExpoFormStepId =
  | "general"
  | "schedule"
  | "management"
  | "halls"
  | "packages"
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
  tenantOptions?: ExpoTenantOption[]
  packageWorkspace?: ExpoPackageFormWorkspace
  initialPackages?: ExpoPackageDisplay[]
  cancelHref?: string
  successHref?: string
  submitEndpoint?: string
  editableScope?: "admin" | "partner-content"
  allowPackageEdit?: boolean
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
