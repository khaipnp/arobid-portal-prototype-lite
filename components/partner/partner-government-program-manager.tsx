"use client"

import {
  LandmarkIcon,
  SendIcon,
  UsersRoundIcon,
  WalletCardsIcon
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { PartnerAccess } from "@/lib/partner/access"
import type { PartnerGovernmentProgramWorkspace } from "@/lib/partner/db"

const numberFormat = new Intl.NumberFormat("en")

export function PartnerGovernmentProgramManager({
  access,
  workspace
}: {
  access: PartnerAccess
  workspace: PartnerGovernmentProgramWorkspace
}) {
  const canManage = access.actions["government.manage"]
  const { quotaWorkspace } = workspace

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Supported SMEs"
          value={numberFormat.format(workspace.supportedSmes)}
          note="Registered or activated members"
          icon={<UsersRoundIcon />}
        />
        <MetricCard
          title="Active Campaigns"
          value={numberFormat.format(workspace.activeCampaigns)}
          note="Invite-code based programs"
          icon={<SendIcon />}
        />
        <MetricCard
          title="Quota Utilization"
          value={`${workspace.quotaUtilization}%`}
          note="Consumed across quota pools"
          icon={<LandmarkIcon />}
        />
        <MetricCard
          title="Credit Utilization"
          value={`${workspace.creditUtilization}%`}
          note={`${numberFormat.format(quotaWorkspace.wallet.consumed)} consumed`}
          icon={<WalletCardsIcon />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Program Quota Pools</CardTitle>
                <CardDescription>
                  Booth quota, expo program quota, and bulk booth inventory for
                  government-backed SME support.
                </CardDescription>
              </div>
              {canManage ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/partner/quota">Manage quota</Link>
                </Button>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {quotaWorkspace.quotas.length === 0 ? (
              <EmptyState label="No government quota pools yet." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pool</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Allocated</TableHead>
                    <TableHead className="text-right">Consumed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotaWorkspace.quotas.map((quota) => (
                    <TableRow key={quota.id}>
                      <TableCell>
                        <p className="font-medium">{quota.label}</p>
                        <Badge variant="outline">{quota.quotaType}</Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(quota.availableQuantity)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(quota.allocatedQuantity)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {numberFormat.format(quota.consumedQuantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>TradeCredit Wallet</CardTitle>
            <CardDescription>
              Government credit balance allocated to supported enterprises.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <WalletRow label="Balance" value={quotaWorkspace.wallet.balance} />
            <WalletRow
              label="Allocated"
              value={quotaWorkspace.wallet.allocated}
            />
            <WalletRow
              label="Consumed"
              value={quotaWorkspace.wallet.consumed}
            />
            <Progress value={workspace.creditUtilization} />
            {canManage ? (
              <Button asChild className="w-full" variant="outline">
                <Link href="/partner/quota">Allocate TradeCredits</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Invite Campaigns</CardTitle>
          <CardDescription>
            Campaign codes used by SMEs to enter government-backed programs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {quotaWorkspace.inviteCampaigns.length === 0 ? (
            <EmptyState label="No invite campaigns yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Quota</TableHead>
                  <TableHead className="text-right">Claims</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotaWorkspace.inviteCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.name}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {campaign.inviteCode}
                    </TableCell>
                    <TableCell>{campaign.quotaLabel ?? "No quota"}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(campaign.claimedCount)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{campaign.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function MetricCard({
  title,
  value,
  note,
  icon
}: {
  title: string
  value: string
  note: string
  icon: React.ReactNode
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-2 text-muted-foreground text-xs [&_svg]:h-4 [&_svg]:w-4">
        {icon}
        <span>{note}</span>
      </CardContent>
    </Card>
  )
}

function WalletRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">
        {numberFormat.format(value)}
      </span>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
      {label}
    </div>
  )
}
