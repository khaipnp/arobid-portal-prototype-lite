import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/tradexpo/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import {
  getAdministrationUserDetail,
  getRequestAuditContext,
  recordUserAuditEvent,
} from "@/lib/administration/user-detail";
import { requireRole } from "@/lib/auth/rbac";
import { ensurePlatformSchema } from "@/lib/platform/ensure-schema";

export const dynamic = "force-dynamic";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function formatAction(value: string) {
  return value.replaceAll(".", " · ").replaceAll("_", " ");
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata);
  if (entries.length === 0) return "—";
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const actorUserId = await requireRole("sys_admin");
  await ensurePlatformSchema();
  const { userId } = await params;
  const auditContext = await getRequestAuditContext();

  await recordUserAuditEvent({
    targetUserId: userId,
    actorUserId,
    actorType: "admin",
    action: "admin.user.view",
    resourceType: "administration_user_detail",
    resourceId: userId,
    summary: "Admin viewed user detail.",
    metadata: { surface: "admin.administration.users.detail" },
    ...auditContext,
  });

  const user = await getAdministrationUserDetail(userId);
  if (!user) notFound();

  const statusLabel = user.isActive ? "Active" : "Inactive";

  return (
    <DashboardShell
      title="User Detail"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Administration" },
        { label: "Users", href: "/admin/administration/users" },
        { label: user.name },
      ]}
      showBackButton
    >
      <div className="mt-4 space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <UserAvatar name={user.name} className="h-16 w-16 text-lg" />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-semibold text-2xl tracking-tight">
                    {user.name}
                  </h1>
                  <Badge variant={user.isActive ? "default" : "secondary"}>
                    {statusLabel}
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">{user.email}</p>
                <p className="text-muted-foreground text-sm">
                  {user.companyName ?? "No company assigned"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-80">
              <Metric label="Roles" value={user.roleCount} />
              <Metric label="Audit events" value={user.auditEventCount} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Core account and organization data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="User ID" value={user.id} mono />
                <DetailItem label="Email" value={user.email} />
                <DetailItem label="Company" value={user.companyName ?? "—"} />
                <DetailItem
                  label="Company ID"
                  value={user.companyId ?? "—"}
                  mono
                />
                <DetailItem label="Job title" value={user.jobTitle ?? "—"} />
                <DetailItem label="Industry" value={user.industry ?? "—"} />
                <DetailItem label="Phone" value={user.phone ?? "—"} />
                <DetailItem label="Location" value={user.location ?? "—"} />
                <DetailItem label="Website" value={user.website ?? "—"} />
                <DetailItem
                  label="Latest audit activity"
                  value={formatDateTime(user.latestActivityAt)}
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Roles</CardTitle>
              <CardDescription>Global and scoped permissions.</CardDescription>
            </CardHeader>
            <CardContent>
              {user.roles.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No roles assigned.
                </p>
              ) : (
                <div className="space-y-3">
                  {user.roles.map((role) => (
                    <div
                      className="rounded-2xl border p-3"
                      key={`${role.roleId}-${role.expoId ?? "global"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium">{role.roleName}</p>
                        <Badge variant="outline">{role.scope}</Badge>
                      </div>
                      <p className="mt-1 font-mono text-muted-foreground text-xs">
                        {role.expoId ?? "global"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Audit & tracking</CardTitle>
            <CardDescription>
              Newest user-related events from admin, auth, and domain modules.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.auditEvents.length === 0 ? (
              <div className="flex min-h-48 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
                No audit events found.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Resource</TableHead>
                      <TableHead>Summary</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {user.auditEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell className="whitespace-nowrap text-xs">
                          {formatDateTime(event.createdAt)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {formatAction(event.action)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {event.actorName ?? event.actorType}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {event.actorEmail ?? event.actorUserId ?? "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">{event.resourceType ?? "—"}</p>
                          <p className="font-mono text-muted-foreground text-xs">
                            {event.resourceId ?? "—"}
                          </p>
                        </TableCell>
                        <TableCell className="max-w-72">
                          {event.summary}
                        </TableCell>
                        <TableCell className="max-w-64 text-muted-foreground text-xs">
                          {formatMetadata(event.metadata)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="font-semibold text-2xl tabular-nums">{value}</p>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </dt>
      <dd className={mono ? "break-all font-mono text-xs" : "text-sm"}>
        {value}
      </dd>
    </div>
  );
}
