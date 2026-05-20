import type { ExpoHallDraft } from "$lib/tradexpo/types"

export function validateHallBlocks(halls: ExpoHallDraft[]): string | null {
  if (halls.length === 0) {
    return "Add at least one hall."
  }
  const names = new Set<string>()
  for (const h of halls) {
    const n = h.hallName.trim()
    if (!n) {
      return "Each hall must have a name."
    }
    if (n.length > 100) {
      return "Hall name must be at most 100 characters."
    }
    const key = n.toLowerCase()
    if (names.has(key)) {
      return "Hall names must be unique within this expo."
    }
    names.add(key)
    if (!h.hallTemplateId) {
      return "Select a hall template for each hall."
    }
    if (h.basicQty < 0 || h.professionalQty < 0 || h.premiumQty < 0) {
      return "Booth quantities cannot be negative."
    }
    if (h.basicQty + h.professionalQty + h.premiumQty <= 0) {
      return "At least one booth tier must have a quantity greater than 0 for each hall."
    }
  }
  return null
}
