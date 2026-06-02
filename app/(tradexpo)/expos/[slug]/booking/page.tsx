import { notFound } from "next/navigation"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
import { getCurrentUserIdFromRequest } from "@/lib/auth/rbac"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"
import { getTradeCreditWallet } from "@/lib/tradecredit/db"
import { getExpoBySlug } from "@/lib/tradexpo/db/platform-data"
import { AROBID_DISPLAY_TARGET_ID } from "@/lib/tradexpo/tenant-display"
import { CURRENT_USER_ID } from "@/lib/user/current-user"
import { BookingContent } from "./booking-content"

async function getBookingUserId() {
  try {
    return await getCurrentUserIdFromRequest()
  } catch {
    return CURRENT_USER_ID
  }
}

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  await ensurePlatformSchema()
  const { slug } = await params
  const expo = await getExpoBySlug(slug)
  if (!expo?.displayTargetIds.includes(AROBID_DISPLAY_TARGET_ID)) {
    notFound()
  }
  const userId = await getBookingUserId()
  const wallet = await getTradeCreditWallet(userId)

  return (
    <main className="min-h-screen bg-[#f9fafb] text-foreground [font-family:var(--font-tight)]">
      <TxHeader />
      <div className="container mx-auto px-4 py-8 md:px-0">
        <BookingContent
          expo={expo}
          tradeCreditWallet={{
            availableCredits: wallet.account.availableBalance,
            creditValueVnd: wallet.activeValuation.creditValueVnd
          }}
        />
      </div>
      <TxFooter />
    </main>
  )
}
