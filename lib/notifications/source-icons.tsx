import {
  BellIcon,
  CalendarIcon,
  CreditCardIcon,
  MessageCircleIcon,
  PackageIcon
} from "lucide-react"
import type { ComponentType } from "react"

const SOURCE_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  chat: MessageCircleIcon,
  tradexpo: CalendarIcon,
  orders: PackageIcon,
  payment: CreditCardIcon
}

export function getNotificationSourceIcon(source: string) {
  return SOURCE_ICON_MAP[source.toLowerCase()] ?? BellIcon
}
