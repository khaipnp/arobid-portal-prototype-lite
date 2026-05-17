import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { requireRole } from "@/lib/auth/rbac"
import {
  listPartnerEnterpriseAssociationAuditEvents,
  type PartnerEnterpriseAssociationAuditAction,
  type PartnerEnterpriseAssociationAuditActor
} from "@/lib/partner/db"
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema"

export const dynamic = "force-dynamic"

const auditActions: PartnerEnterpriseAssociationAuditAction[] = [
  "invite",
  "resend_invite",
  "accept",
  "activate",
  "deactivate",
  "remove",
  "block",
  "unblock",
  "reactivate"
]

const actorTypes: PartnerEnterpriseAssociationAuditActor[] = [
  "partner_user",
  "company_user",
  "arobid_admin",
  "system"
]

function formatLabel(value: string) {
  return value.replaceAll("_", " ")
}

export default async function PartnerAssociationAuditPage({
  searchParams
}: {
  searchParams: Promise<{
    q?: string
    action?: string
    source?: string
    actorType?: string
  }>
}) {
  await requireRole("sys_admin")
  await ensurePlatformSchema()
  const params = await searchParams
  const action = auditActions.includes(
    params.action as PartnerEnterpriseAssociationAuditAction
  )
    ? (params.action as PartnerEnterpriseAssociationAuditAction)
    : undefined
  const actorType = actorTypes.includes(
    params.actorType as PartnerEnterpriseAssociationAuditActor
  )
    ? (params.actorType as PartnerEnterpriseAssociationAuditActor)
    : undefined
  const events = await listPartnerEnterpriseAssociationAuditEvents({
    q: params.q,
    action,
    source: params.source || undefined,
    actorType,
    limit: 20
  })

  return (
    <DashboardShell
      title="Company Association Audit"
      description="Read-only trace of Tenant company association lifecycle changes."
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Partners", href: "/admin/partners" },
        { label: "Association Audit" }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Audit events</CardTitle>
          <CardDescription>
            Newest 20 invite, accept, removal, and governance events.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_180px_180px_auto]">
            <Input
              name="q"
              placeholder="Search organization, company, ID..."
              defaultValue={params.q ?? ""}
            />
            <NativeSelect name="action" defaultValue={action ?? ""}>
              <option value="">All actions</option>
              {auditActions.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect name="actorType" defaultValue={actorType ?? ""}>
              <option value="">All actors</option>
              {actorTypes.map((item) => (
                <option key={item} value={item}>
                  {formatLabel(item)}
                </option>
              ))}
            </NativeSelect>
            <Input
              name="source"
              placeholder="Source"
              defaultValue={params.source ?? ""}
            />
            <button
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm"
              type="submit"
            >
              Filter
            </button>
          </form>

          {events.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
              No audit events found.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Partner Organization</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status change</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {new Date(event.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{event.partnerOrgName}</p>
                      <p className="text-muted-foreground text-xs">
                        {event.partnerOrgId}
                      </p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{event.enterpriseName}</p>
                      <p className="text-muted-foreground text-xs">
                        {event.enterpriseId ?? "No enterprise ID"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Badge variant="outline">
                          {formatLabel(event.action)}
                        </Badge>
                        <p className="text-muted-foreground text-xs">
                          {event.source}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {event.oldStatus ?? "none"} → {event.newStatus}
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{formatLabel(event.actorType)}</p>
                      <p className="text-muted-foreground text-xs">
                        {event.actorLabel ?? event.actorId ?? "system"}
                      </p>
                    </TableCell>
                    <TableCell className="max-w-56 text-sm">
                      {event.reason ?? "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  )
}
