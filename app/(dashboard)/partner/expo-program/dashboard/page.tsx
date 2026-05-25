import {
  BoxesIcon,
  CalendarDaysIcon,
  FileTextIcon,
  RadioTowerIcon,
  WalletCardsIcon,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/tradexpo/dashboard-shell";
import { ExpoStatusBadge } from "@/components/tradexpo/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireRole } from "@/lib/auth/rbac";
import { requirePartnerTab } from "@/lib/partner/access";
import type { PartnerAssignedExpo } from "@/lib/partner/db";
import {
  getPartnerDashboardMetrics,
  getPartnerExpoProgramsWorkspace,
} from "@/lib/partner/db";
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema";

const numberFormat = new Intl.NumberFormat("en");
const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1,
});
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso: string) {
  return dateFormat.format(new Date(iso));
}

function buildSummary(assignedExpos: PartnerAssignedExpo[]) {
  return assignedExpos.reduce(
    (summary, item) => {
      summary.totalExpos += 1;
      summary.totalBooths += item.totalBooths;

      if (item.expo.status === "Live") summary.liveExpos += 1;
      if (item.expo.status === "Draft") summary.draftExpos += 1;

      return summary;
    },
    {
      totalExpos: 0,
      liveExpos: 0,
      draftExpos: 0,
      totalBooths: 0,
    },
  );
}

export const dynamic = "force-dynamic";

export default async function PartnerExpoProgramDashboardPage() {
  await ensurePlatformSchema();
  const userId = await requireRole("partner");
  await requirePartnerTab(userId, "expo");
  const [workspace, metrics] = await Promise.all([
    getPartnerExpoProgramsWorkspace(userId),
    getPartnerDashboardMetrics(userId),
  ]);
  const assignedExpos = workspace.assignedExpos;
  const summary = buildSummary(assignedExpos);

  return (
    <DashboardShell
      title="Dashboard"
      breadcrumbs={[
        { label: "Dashboard", href: "/partner" },
        { label: "Expo Programs" },
        { label: "Dashboard" },
      ]}
    >
      <div className="mt-5 space-y-6">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Total Expo"
            value={numberFormat.format(summary.totalExpos)}
            icon={<CalendarDaysIcon className="size-4" />}
          />
          <MetricCard
            title="Live Expo"
            value={numberFormat.format(summary.liveExpos)}
            icon={<RadioTowerIcon className="size-4" />}
          />
          <MetricCard
            title="Draft Expo"
            value={numberFormat.format(summary.draftExpos)}
            icon={<FileTextIcon className="size-4" />}
          />
          <MetricCard
            title="Total Booth"
            value={numberFormat.format(summary.totalBooths)}
            icon={<BoxesIcon className="size-4" />}
          />
          <MetricCard
            title="Paid Revenue"
            value={currencyFormat.format(metrics.totals.revenue)}
            icon={<WalletCardsIcon className="size-4" />}
          />
        </section>

        <div className="overflow-x-auto rounded-2xl border">
          <Table className="min-w-3xl">
            <TableHeader>
              <TableRow>
                <TableHead>Expo Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Booth Count</TableHead>
                <TableHead className="text-right">Sold Booths</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead className="text-right">Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignedExpos.map(({ expo, totalBooths, soldBooths }) => (
                <TableRow key={expo.id}>
                  <TableCell className="max-w-80 whitespace-normal py-4 font-medium">
                    <Link
                      href={`/partner/expo-program/expos/${expo.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {expo.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ExpoStatusBadge status={expo.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(totalBooths)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {numberFormat.format(soldBooths)}
                  </TableCell>
                  <TableCell>{formatDate(expo.startDate)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="rounded-full"
                    >
                      <Link href={`/partner/expo-program/expos/${expo.id}`}>
                        Detail
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {assignedExpos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <span>No assigned expo programs available yet.</span>
                      <span className="text-xs">
                        Arobid Business assigns expos to partner accounts.
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardShell>
  );
}

function MetricCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="text-muted-foreground text-sm">{title}</div>
          <div className="font-semibold text-3xl tabular-nums tracking-tight">
            {value}
          </div>
        </div>
        <div className="rounded-2xl bg-muted p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}
