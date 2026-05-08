import { notFound } from "next/navigation"
import { TxFooter } from "@/components/landing/tx-footer"
import { TxHeader } from "@/components/landing/tx-header"
import { ExhibitorsSection } from "@/components/tradexpo/exhibitors-section"
import {
  About,
  Audience,
  BoothTier,
  Breadcrumb,
  Categories,
  Hero,
  ParticipantValues,
  Sponsors,
} from "@/components/tradexpo/vifmw-2026/sections"
import {
  getExpoBySlug,
  listExpoDetailExhibitorsByName,
} from "@/lib/tradexpo/db/platform-data"

function toLongDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date))
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const expo = await getExpoBySlug(slug)
  if (!expo) notFound()

  const exhibitors = await listExpoDetailExhibitorsByName(expo.name)

  return (
    <main className="min-h-screen bg-white text-[#030712] [font-family:var(--font-tight)]">
      <TxHeader />
      <Breadcrumb />
      <Hero
        expoTitle={expo.name}
        startDateLabel={toLongDate(expo.startDate)}
        endDateLabel={toLongDate(expo.endDate)}
      />
      <About />
      <Sponsors />
      <ExhibitorsSection expoName={expo.name} initialExhibitors={exhibitors} />
      <Audience />
      <Categories />
      <ParticipantValues />
      <BoothTier />
      <TxFooter />
    </main>
  )
}
