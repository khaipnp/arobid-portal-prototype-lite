import Link from "next/link"
import { notFound } from "next/navigation"
import { CompanyDetailForm } from "@/components/administration/company-detail-form"
import { DashboardShell } from "@/components/tradexpo/dashboard-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { listCompanyCategoryOptions } from "@/lib/administration/companies"
import { getAdministrationCompanyDetail } from "@/lib/administration/company-detail"
import { requireRole } from "@/lib/auth/rbac"

export const dynamic = "force-dynamic"

function getCompanyInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return initials || "—"
}

function formatDateTime(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

export default async function AdminCompanyDetailPage({
  params
}: {
  params: Promise<{ companyId: string }>
}) {
  await requireRole("sys_admin")
  const { companyId } = await params
  const [company, categories] = await Promise.all([
    getAdministrationCompanyDetail(companyId),
    listCompanyCategoryOptions()
  ])

  if (!company) notFound()

  const statusLabel = company.isActive ? "Approved" : "Pending"

  return (
    <DashboardShell
      title="Company Detail"
      breadcrumbs={[
        { label: "Dashboard", href: "/admin" },
        { label: "Administration" },
        { label: "Companies", href: "/admin/administration/companies" },
        { label: company.name }
      ]}
      showBackButton
    >
      <div className="mt-4 space-y-6">
        <Card>
          <CardContent className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="size-16 text-lg" size="lg">
                {company.logoUrl ? (
                  <AvatarImage
                    src={company.logoUrl}
                    alt={`${company.name} logo`}
                  />
                ) : null}
                <AvatarFallback>
                  {getCompanyInitials(company.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-semibold text-2xl tracking-tight">
                    {company.name}
                  </h1>
                  <Badge variant={company.isActive ? "default" : "secondary"}>
                    {statusLabel}
                  </Badge>
                </div>
                <p className="font-mono text-muted-foreground text-xs">
                  {company.id}
                </p>
                <p className="text-muted-foreground text-sm">
                  {company.website ?? "No website"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 md:min-w-80">
              <Metric label="Users" value={company.userCount} />
              <Metric label="Products" value={company.productCount} />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Company profile</CardTitle>
              <CardDescription>
                Core company information managed by system admins.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompanyDetailForm company={company} categories={categories} />
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Representative</CardTitle>
                <CardDescription>
                  Account assigned as company representative.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {company.representativeAccount ? (
                  <Link
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50"
                    href={`/admin/administration/users/${company.representativeAccount.id}`}
                  >
                    <Avatar size="lg">
                      {company.representativeAccount.avatarUrl ? (
                        <AvatarImage
                          src={company.representativeAccount.avatarUrl}
                          alt={company.representativeAccount.name}
                        />
                      ) : null}
                      <AvatarFallback>
                        {getCompanyInitials(company.representativeAccount.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {company.representativeAccount.name}
                      </p>
                      <p className="truncate text-muted-foreground text-xs">
                        {company.representativeAccount.email}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No representative assigned.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company accounts</CardTitle>
                <CardDescription>
                  Accounts that can be selected as representative.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {company.userAccounts.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No accounts belong to this company.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {company.userAccounts.map((account) => (
                      <Link
                        key={account.id}
                        className="block rounded-lg border p-3 hover:bg-muted/50"
                        href={`/admin/administration/users/${account.id}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{account.name}</p>
                          <Badge
                            variant={account.isActive ? "default" : "secondary"}
                          >
                            {account.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-muted-foreground text-xs">
                          {account.email}
                        </p>
                        {account.roleIds.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {account.roleIds.map((roleId) => (
                              <Badge key={roleId} variant="outline">
                                {roleId}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Industries</CardTitle>
                <CardDescription>Selected level-3 categories.</CardDescription>
              </CardHeader>
              <CardContent>
                {company.categoryNames.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No industries assigned.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {company.categoryNames.map((categoryName) => (
                      <Badge key={categoryName} variant="secondary">
                        {categoryName}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tracking</CardTitle>
                <CardDescription>
                  Creation and last update times.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Tax ID" value={company.taxId ?? "—"} />
                <DetailRow
                  label="Created"
                  value={formatDateTime(company.createdAt)}
                />
                <DetailRow
                  label="Updated"
                  value={formatDateTime(company.updatedAt)}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-muted/30 p-3">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className="font-semibold text-2xl tabular-nums">{value}</p>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}
