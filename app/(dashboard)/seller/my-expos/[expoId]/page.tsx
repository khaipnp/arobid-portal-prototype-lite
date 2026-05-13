import { SellerExpoDetail } from "@/components/seller/seller-expo-detail"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { requireRole } from "@/lib/auth/rbac"
import { sql } from "@/lib/db/neon"
import { listCustomerOrders } from "@/lib/orders/db"
import { listBoothTemplates } from "@/lib/tradexpo/db/booth-templates"
import {
  listBoothCustomizations,
  listExpos,
  listSellerBoothRegistrations
} from "@/lib/tradexpo/db/platform-data"

interface Props {
  params: Promise<{ expoId: string }>
}

export const dynamic = "force-dynamic"

type TimelinePhase = "Upcoming" | "Live" | "Archived"

function computeTimelinePhase(
  expo: NonNullable<Awaited<ReturnType<typeof listExpos>>[number]>
): TimelinePhase {
  const now = new Date()
  const start = new Date(expo.startAt ?? `${expo.startDate}T00:00:00`)
  const end = new Date(expo.endAt ?? `${expo.endDate}T23:59:59`)

  if (start.getTime() > now.getTime()) return "Upcoming"
  if (end.getTime() < now.getTime()) return "Archived"
  return "Live"
}

export default async function SellerExpoDetailPage({ params }: Props) {
  const { expoId } = await params
  const userId = await requireRole("seller")

  // Get user's company ID
  const users = (await sql`
    select id, name, email from users where id = ${userId} limit 1
  `) as {
    id: string
    name: string | null
    email: string
  }[]
  const sellerProfile = users[0]
    ? {
        name: users[0].name ?? users[0].email,
        email: users[0].email
      }
    : null

  const [
    expos,
    allRegistrations,
    boothTemplates,
    boothCustomizations,
    customerOrders
  ] = await Promise.all([
    listExpos(),
    listSellerBoothRegistrations(userId),
    listBoothTemplates(),
    listBoothCustomizations(),
    listCustomerOrders(userId)
  ])

  const expo = expos.find((e) => e.id === expoId) ?? null
  const registrations = allRegistrations.filter((r) => r.expoId === expoId)
  const timelinePhase = expo ? computeTimelinePhase(expo) : null

  function formatDate(iso: string) {
    return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
      new Date(iso)
    )
  }

  return (
    <DashboardShell
      title={expo?.name ?? "Expo Detail"}
      description={
        expo
          ? `${formatDate(expo.startAt ?? `${expo.startDate}T00:00:00`)} - ${formatDate(expo.endAt ?? `${expo.endDate}T23:59:59`)}`
          : ""
      }
      breadcrumbs={[
        { label: "Dashboard", href: "/seller" },
        { label: "My Expos", href: "/seller/my-expos" },
        { label: expo?.name ?? expoId }
      ]}
      showBackButton
    >
      <SellerExpoDetail
        expoId={expoId}
        expo={expo}
        registrations={registrations}
        boothTemplates={boothTemplates}
        boothCustomizations={boothCustomizations}
        customerOrders={customerOrders}
        sellerProfile={sellerProfile}
        timelinePhase={timelinePhase}
      />
    </DashboardShell>
  )
}
