import type { ExpoHall, ExpoMarketingContent } from "@/lib/tradexpo/types"
import type {
  AudienceCardFormRow,
  BenefitCardFormRow,
  HallFormRow
} from "./types"

export function rowKey(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2)}`
}

export function newHallRow(index: number): HallFormRow {
  return {
    key: `hall-${Math.random().toString(36).slice(2)}`,
    hallName: `Hall ${String.fromCharCode(65 + index)}`,
    hallTemplateId: "",
    basicQty: 0,
    professionalQty: 0,
    premiumQty: 0
  }
}

export function hallsToRows(halls: ExpoHall[]): HallFormRow[] {
  if (halls.length === 0) return [newHallRow(0)]
  return halls.map((h) => ({
    key: h.id,
    hallName: h.hallName,
    hallTemplateId: h.hallTemplateId,
    basicQty: h.basicQty,
    professionalQty: h.professionalQty,
    premiumQty: h.premiumQty
  }))
}

export function audienceRowsFromContent(
  content: ExpoMarketingContent
): AudienceCardFormRow[] {
  return content.whoShouldJoin.audienceCards.map((card) => ({
    ...card,
    key: rowKey("audience")
  }))
}

export function benefitRowsFromContent(
  content: ExpoMarketingContent
): BenefitCardFormRow[] {
  return content.audienceBenefits.benefitCards.map((card) => ({
    ...card,
    key: rowKey("benefit")
  }))
}

export function newAudienceCard(): AudienceCardFormRow {
  return {
    key: rowKey("audience"),
    title: "",
    description: "",
    tags: [],
    displayOrder: 0
  }
}

export function newBenefitCard(): BenefitCardFormRow {
  return {
    key: rowKey("benefit"),
    audienceName: "",
    icon: "badge",
    benefitItems: [""],
    isFeatured: false,
    displayOrder: 0
  }
}
