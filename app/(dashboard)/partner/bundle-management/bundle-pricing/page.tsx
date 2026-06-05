import { ArrowUpRightIcon } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle
} from "@/components/ui/empty"

export default function DeferredPartnerModulePage() {
  return (
    <DashboardShell
      breadcrumbs={[
        { label: "Dashboard", href: "/partner" },
        { label: "Bundle Management" },
        { label: "Bundle Pricing" }
      ]}
    >
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <Image
              src="/assets/images/upcoming.png"
              alt="Upcoming Feature"
              width={256}
              height={256}
            />
          </EmptyMedia>
          <EmptyTitle className="font-bold text-3xl">
            Feature Coming Soon!
          </EmptyTitle>
          <EmptyDescription>
            The feature is coming soon. In the meantime, please contact with
            Customer Support for any questions.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent className="flex-row justify-center gap-2">
          <Link href="/">
            <Button>Visit Marketplace</Button>
          </Link>
          <Link href="/partner">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </EmptyContent>
        <Button
          variant="link"
          asChild
          className="text-muted-foreground"
          size="sm"
        >
          <Link href="#">
            Learn More <ArrowUpRightIcon />
          </Link>
        </Button>
      </Empty>
    </DashboardShell>
  )
}
