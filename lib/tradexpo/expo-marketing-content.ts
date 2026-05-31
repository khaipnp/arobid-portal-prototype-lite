import type {
  ExpoBenefitCardContent,
  ExpoMarketingContent,
  ExpoMarketingIconKey
} from "@/lib/tradexpo/types"

const MAX_CARDS = 6

export const EXPO_MARKETING_ICON_KEYS = ["badge", "rocket", "gem"] as const

export const DEFAULT_EXPO_MARKETING_CONTENT: ExpoMarketingContent = {
  whoShouldJoin: {
    enabled: true,
    sectionTitle: "Who should join?",
    audienceCards: [
      {
        title: "The Buyers",
        description:
          "Real estate developers, main contractors, and architects seeking high-performance materials and infrastructure solutions.",
        tags: ["Real Estate", "Construction", "Architects"],
        displayOrder: 0
      },
      {
        title: "The Suppliers",
        description:
          "Material manufacturers and tech providers digitizing their portfolios to reach high-intent buyers globally.",
        tags: ["Manufacturers", "Tech", "Global"],
        displayOrder: 1
      },
      {
        title: "The Partners",
        description:
          "Trade associations, logistics, and councils that facilitate seamless global supply chains.",
        tags: ["Logistics", "Councils", "Associations"],
        displayOrder: 2
      }
    ]
  },
  audienceBenefits: {
    enabled: true,
    sectionTitle: "Giá trị đặc quyền từng đối tượng",
    sectionSubtitle:
      "Specialized digital solutions to maximize trade efficiency and technical connectivity for all participants.",
    benefitCards: [
      {
        audienceName: "Buyers (Visitors)",
        icon: "badge",
        benefitItems: [
          "Direct access to verified supply sources from reputable manufacturers.",
          "Explore and evaluate products intuitively through advanced 3D/VR technology.",
          "Connect directly and facilitate trade via integrated video conferencing tools."
        ],
        isFeatured: false,
        displayOrder: 0
      },
      {
        audienceName: "Sellers (Exhibitors)",
        icon: "rocket",
        benefitItems: [
          "Establish a professional digital presence with world-class virtual booths.",
          "Engage with a vast network of potential global buyers and sourcing specialists.",
          "Maximize cost-efficiency and operational agility compared to traditional models."
        ],
        isFeatured: true,
        displayOrder: 1
      },
      {
        audienceName: "Partners",
        icon: "gem",
        benefitItems: [
          "Enhance brand visibility among high-profile industry audiences and strategic leads.",
          "Gain exclusive partnership benefits and high-level networking opportunities.",
          "Access post-event data analytics and in-depth market intelligence reports."
        ],
        isFeatured: false,
        displayOrder: 2
      }
    ]
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function cleanTags(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.map(cleanText).filter(Boolean).slice(0, 8)
}

function cleanIcon(value: unknown): ExpoMarketingIconKey {
  return EXPO_MARKETING_ICON_KEYS.includes(value as ExpoMarketingIconKey)
    ? (value as ExpoMarketingIconKey)
    : "badge"
}

function normalizeAudienceCards(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.slice(0, MAX_CARDS).map((raw, index) => {
    const card = asRecord(raw)
    return {
      title: cleanText(card.title),
      description: cleanText(card.description),
      tags: cleanTags(card.tags),
      displayOrder: index
    }
  })
}

function normalizeBenefitCards(value: unknown): ExpoBenefitCardContent[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, MAX_CARDS).map((raw, index) => {
    const card = asRecord(raw)
    const benefitItems = Array.isArray(card.benefitItems)
      ? card.benefitItems.map(cleanText).filter(Boolean).slice(0, 8)
      : []
    return {
      audienceName: cleanText(card.audienceName),
      icon: cleanIcon(card.icon),
      benefitItems,
      isFeatured: card.isFeatured === true,
      displayOrder: index
    }
  })
}

export function normalizeExpoMarketingContent(
  input: unknown
): ExpoMarketingContent {
  const root = asRecord(input)
  const who = asRecord(root.whoShouldJoin)
  const benefits = asRecord(root.audienceBenefits)
  const audienceCards = normalizeAudienceCards(who.audienceCards)
  const benefitCards = normalizeBenefitCards(benefits.benefitCards)
  const featuredIndex = benefitCards.findIndex((card) => card.isFeatured)

  return {
    whoShouldJoin: {
      enabled: who.enabled !== false,
      sectionTitle: cleanText(who.sectionTitle) || "Who should join?",
      sectionSubtitle: cleanText(who.sectionSubtitle) || undefined,
      audienceCards
    },
    audienceBenefits: {
      enabled: benefits.enabled !== false,
      sectionTitle:
        cleanText(benefits.sectionTitle) || "Giá trị đặc quyền từng đối tượng",
      sectionSubtitle: cleanText(benefits.sectionSubtitle) || undefined,
      benefitCards: benefitCards.map((card, index) => ({
        ...card,
        isFeatured: featuredIndex >= 0 ? index === featuredIndex : false
      }))
    }
  }
}

export type ExpoMarketingContentValidationResult =
  | { ok: true; content: ExpoMarketingContent }
  | { ok: false; error: string }

export function validateExpoMarketingContent(
  input: unknown
): ExpoMarketingContentValidationResult {
  const content = normalizeExpoMarketingContent(input)

  if (content.whoShouldJoin.enabled) {
    if (content.whoShouldJoin.audienceCards.length === 0) {
      return { ok: false, error: "Add at least one audience card." }
    }
    for (const card of content.whoShouldJoin.audienceCards) {
      if (!card.title || !card.description) {
        return {
          ok: false,
          error: "Audience cards require title and description."
        }
      }
    }
  }

  if (content.audienceBenefits.enabled) {
    if (content.audienceBenefits.benefitCards.length === 0) {
      return { ok: false, error: "Add at least one benefit card." }
    }
    const featuredCount = content.audienceBenefits.benefitCards.filter(
      (card) => card.isFeatured
    ).length
    if (featuredCount > 1) {
      return { ok: false, error: "Only one benefit card can be featured." }
    }
    for (const card of content.audienceBenefits.benefitCards) {
      if (!card.audienceName || card.benefitItems.length === 0) {
        return {
          ok: false,
          error: "Benefit cards require audience name and at least one benefit."
        }
      }
    }
  }

  return { ok: true, content }
}

export function getExpoMarketingContentForRender(input: unknown) {
  const parsed = validateExpoMarketingContent(input)
  return parsed.ok ? parsed.content : DEFAULT_EXPO_MARKETING_CONTENT
}
