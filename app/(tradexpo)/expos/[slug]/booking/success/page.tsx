import { notFound } from "next/navigation"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
import { BookingSuccessContent } from "@/components/tradexpo/expo-detail/booking-success-content"
import { getExpoBySlug } from "@/lib/tradexpo/db/platform-data"
import { AROBID_DISPLAY_TARGET_ID } from "@/lib/tradexpo/tenant-display"

export default async function Page({
  params
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const expo = await getExpoBySlug(slug)
  if (!expo?.displayTargetIds.includes(AROBID_DISPLAY_TARGET_ID)) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#f9fafb] text-foreground [font-family:var(--font-tight)]">
      <TxHeader />
      <div className="container mx-auto px-4 py-8 md:px-0">
        <BookingSuccessContent
          expoName={expo.name}
          expoSlug={expo.slug || expo.id}
        />
      </div>
      <TxFooter />
    </main>
  )
}
