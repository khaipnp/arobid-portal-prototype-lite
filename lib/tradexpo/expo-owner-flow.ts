export type ExpoOwnerSelection = {
  id: string
  email: string
  name: string
  imageUrl?: string | null
}

export function getOwnerDisplay(
  owner: ExpoOwnerSelection | null,
  fallbackEmail: string
) {
  if (owner) {
    return { label: owner.name, email: owner.email, imageUrl: owner.imageUrl }
  }
  const email = fallbackEmail.trim()
  return email ? { label: email, email } : null
}

export function confirmOwnerChange(_currentOwner: ExpoOwnerSelection | null) {
  return {
    ownerQuery: "",
    ownerPick: null,
    isChangingOwner: true
  }
}
