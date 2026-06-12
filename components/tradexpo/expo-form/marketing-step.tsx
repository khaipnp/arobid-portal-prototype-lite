import { PlusIcon, Trash2Icon } from "lucide-react"
import type * as React from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ExpoMarketingIconKey } from "@/lib/tradexpo/types"
import { MARKETING_ICON_OPTIONS } from "./constants"
import { newAudienceCard, newBenefitCard } from "./row-helpers"
import type { AudienceCardFormRow, BenefitCardFormRow } from "./types"

type MarketingStepProps = {
  whoEnabled: boolean
  onWhoEnabledChange: (value: boolean) => void
  whoTitle: string
  onWhoTitleChange: (value: string) => void
  whoSubtitle: string
  onWhoSubtitleChange: (value: string) => void
  audienceCards: AudienceCardFormRow[]
  onAudienceCardsChange: React.Dispatch<
    React.SetStateAction<AudienceCardFormRow[]>
  >
  onUpdateAudienceCard: (
    index: number,
    patch: Partial<AudienceCardFormRow>
  ) => void
  benefitsEnabled: boolean
  onBenefitsEnabledChange: (value: boolean) => void
  benefitsTitle: string
  onBenefitsTitleChange: (value: string) => void
  benefitsSubtitle: string
  onBenefitsSubtitleChange: (value: string) => void
  benefitCards: BenefitCardFormRow[]
  onBenefitCardsChange: React.Dispatch<
    React.SetStateAction<BenefitCardFormRow[]>
  >
  onUpdateBenefitCard: (
    index: number,
    patch: Partial<BenefitCardFormRow>
  ) => void
  onUpdateBenefitItem: (
    cardIndex: number,
    itemIndex: number,
    value: string
  ) => void
}

export function MarketingStep({
  whoEnabled,
  onWhoEnabledChange,
  whoTitle,
  onWhoTitleChange,
  whoSubtitle,
  onWhoSubtitleChange,
  audienceCards,
  onAudienceCardsChange,
  onUpdateAudienceCard,
  benefitsEnabled,
  onBenefitsEnabledChange,
  benefitsTitle,
  onBenefitsTitleChange,
  benefitsSubtitle,
  onBenefitsSubtitleChange,
  benefitCards,
  onBenefitCardsChange,
  onUpdateBenefitCard,
  onUpdateBenefitItem
}: MarketingStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-semibold text-xl leading-none">Marketing</h2>
        <p className="text-muted-foreground text-sm">
          Configure public Expo Detail content. Exhibited Categories still come
          from selected Expo categories.
        </p>
      </div>
      <div className="space-y-6">
        <AudienceCardsSection
          enabled={whoEnabled}
          onEnabledChange={onWhoEnabledChange}
          title={whoTitle}
          onTitleChange={onWhoTitleChange}
          subtitle={whoSubtitle}
          onSubtitleChange={onWhoSubtitleChange}
          cards={audienceCards}
          onCardsChange={onAudienceCardsChange}
          onUpdateCard={onUpdateAudienceCard}
        />

        <BenefitCardsSection
          enabled={benefitsEnabled}
          onEnabledChange={onBenefitsEnabledChange}
          title={benefitsTitle}
          onTitleChange={onBenefitsTitleChange}
          subtitle={benefitsSubtitle}
          onSubtitleChange={onBenefitsSubtitleChange}
          cards={benefitCards}
          onCardsChange={onBenefitCardsChange}
          onUpdateCard={onUpdateBenefitCard}
          onUpdateBenefitItem={onUpdateBenefitItem}
        />
      </div>
    </div>
  )
}

type AudienceCardsSectionProps = {
  enabled: boolean
  onEnabledChange: (value: boolean) => void
  title: string
  onTitleChange: (value: string) => void
  subtitle: string
  onSubtitleChange: (value: string) => void
  cards: AudienceCardFormRow[]
  onCardsChange: React.Dispatch<React.SetStateAction<AudienceCardFormRow[]>>
  onUpdateCard: (index: number, patch: Partial<AudienceCardFormRow>) => void
}

function AudienceCardsSection({
  enabled,
  onEnabledChange,
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  cards,
  onCardsChange,
  onUpdateCard
}: AudienceCardsSectionProps) {
  return (
    <section className="space-y-4 rounded-2xl border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-medium text-sm">Who should join?</h3>
          <p className="text-muted-foreground text-xs">
            Add audience groups shown on Expo Detail.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={enabled}
            onCheckedChange={(v) => onEnabledChange(Boolean(v))}
          />
          Enabled
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Section title</Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Subtitle</Label>
          <Input
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-3">
        {cards.map((card, index) => (
          <div key={card.key} className="grid gap-3 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">Audience {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={cards.length <= 1}
                onClick={() =>
                  onCardsChange((prev) => prev.filter((_, i) => i !== index))
                }
              >
                <Trash2Icon />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={card.title}
                onChange={(e) =>
                  onUpdateCard(index, {
                    title: e.target.value
                  })
                }
                placeholder="The Buyers"
              />
              <Input
                value={card.tags.join(", ")}
                onChange={(e) =>
                  onUpdateCard(index, {
                    tags: e.target.value
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean)
                  })
                }
                placeholder="Retailers, Distributors"
              />
            </div>
            <Textarea
              value={card.description}
              onChange={(e) =>
                onUpdateCard(index, {
                  description: e.target.value
                })
              }
              rows={2}
              placeholder="Describe why this group should join."
            />
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={cards.length >= 6}
          onClick={() => onCardsChange((prev) => [...prev, newAudienceCard()])}
        >
          <PlusIcon className="mr-1 size-4" />
          Add audience
        </Button>
      </div>
    </section>
  )
}

type BenefitCardsSectionProps = {
  enabled: boolean
  onEnabledChange: (value: boolean) => void
  title: string
  onTitleChange: (value: string) => void
  subtitle: string
  onSubtitleChange: (value: string) => void
  cards: BenefitCardFormRow[]
  onCardsChange: React.Dispatch<React.SetStateAction<BenefitCardFormRow[]>>
  onUpdateCard: (index: number, patch: Partial<BenefitCardFormRow>) => void
  onUpdateBenefitItem: (
    cardIndex: number,
    itemIndex: number,
    value: string
  ) => void
}

function BenefitCardsSection({
  enabled,
  onEnabledChange,
  title,
  onTitleChange,
  subtitle,
  onSubtitleChange,
  cards,
  onCardsChange,
  onUpdateCard,
  onUpdateBenefitItem
}: BenefitCardsSectionProps) {
  return (
    <section className="space-y-4 rounded-lg border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-medium text-sm">
            Giá trị đặc quyền từng đối tượng
          </h3>
          <p className="text-muted-foreground text-xs">
            Benefit cards render without user-configured CTA.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={enabled}
            onCheckedChange={(v) => onEnabledChange(Boolean(v))}
          />
          Enabled
        </label>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label>Section title</Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>Subtitle</Label>
          <Input
            value={subtitle}
            onChange={(e) => onSubtitleChange(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-3">
        {cards.map((card, cardIndex) => (
          <div key={card.key} className="grid gap-3 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm">Benefit {cardIndex + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                disabled={cards.length <= 1}
                onClick={() =>
                  onCardsChange((prev) =>
                    prev.filter((_, i) => i !== cardIndex)
                  )
                }
              >
                <Trash2Icon />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto]">
              <Input
                value={card.audienceName}
                onChange={(e) =>
                  onUpdateCard(cardIndex, {
                    audienceName: e.target.value
                  })
                }
                placeholder="Dành cho Buyers"
              />
              <Select
                value={card.icon}
                onValueChange={(value) =>
                  onUpdateCard(cardIndex, {
                    icon: value as ExpoMarketingIconKey
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MARKETING_ICON_OPTIONS.map(({ value, label, Icon }) => (
                    <SelectItem key={value} value={value}>
                      <span className="inline-flex items-center gap-2">
                        <Icon className="size-4" />
                        {label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={card.isFeatured}
                  onCheckedChange={(v) =>
                    onUpdateCard(cardIndex, {
                      isFeatured: Boolean(v)
                    })
                  }
                />
                Featured
              </label>
            </div>
            <div className="space-y-2">
              {card.benefitItems.map((item, itemIndex) => (
                <div key={`${card.key}-item-${item}`} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) =>
                      onUpdateBenefitItem(cardIndex, itemIndex, e.target.value)
                    }
                    placeholder="Benefit item"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={card.benefitItems.length <= 1}
                    onClick={() =>
                      onUpdateCard(cardIndex, {
                        benefitItems: card.benefitItems.filter(
                          (_, i) => i !== itemIndex
                        )
                      })
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={card.benefitItems.length >= 8}
                onClick={() =>
                  onUpdateCard(cardIndex, {
                    benefitItems: [...card.benefitItems, ""]
                  })
                }
              >
                <PlusIcon className="mr-1 size-4" />
                Add benefit
              </Button>
            </div>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={cards.length >= 6}
          onClick={() => onCardsChange((prev) => [...prev, newBenefitCard()])}
        >
          <PlusIcon className="mr-1 size-4" />
          Add benefit card
        </Button>
      </div>
    </section>
  )
}
