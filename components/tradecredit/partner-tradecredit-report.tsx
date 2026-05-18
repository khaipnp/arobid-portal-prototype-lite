import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import type { PartnerTradeCreditReport } from "@/lib/tradecredit/types"

const numberFormat = new Intl.NumberFormat("en")
const vnd = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0
})

export function PartnerTradeCreditReportView({
  reports
}: {
  reports: PartnerTradeCreditReport[]
}) {
  const totals = reports.reduce(
    (acc, report) => {
      acc.totalCreditsBurned += report.totalCreditsBurned
      acc.burnEvents += report.burnEvents
      acc.boothBookingsSupported += report.boothBookingsSupported
      acc.creditAssistedGmv += report.creditAssistedGmv
      return acc
    },
    {
      totalCreditsBurned: 0,
      burnEvents: 0,
      boothBookingsSupported: 0,
      creditAssistedGmv: 0
    }
  )

  return (
    <div className="space-y-4 px-4">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Credits Burned"
          value={numberFormat.format(totals.totalCreditsBurned)}
          note="Assigned expo scope only"
        />
        <MetricCard
          title="Burn Events"
          value={numberFormat.format(totals.burnEvents)}
          note="Successful burn transactions"
        />
        <MetricCard
          title="Booth Bookings"
          value={numberFormat.format(totals.boothBookingsSupported)}
          note="Bookings supported by TradeCredit"
        />
        <MetricCard
          title="Credit-Assisted GMV"
          value={vnd.format(totals.creditAssistedGmv)}
          note="Gross order value before final payable"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Expo Reports</CardTitle>
          <CardDescription>
            Report-only aggregate metrics. User wallet balances, rule
            configuration, issuance, and adjustment actions are not exposed to
            Partner/Tenant users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="flex min-h-36 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
              No assigned TradeCredit report scope.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Expo / Campaign</TableHead>
                  <TableHead className="text-right">Credits Burned</TableHead>
                  <TableHead className="text-right">Burn Events</TableHead>
                  <TableHead className="text-right">Booth Bookings</TableHead>
                  <TableHead className="text-right">
                    Credit-Assisted GMV
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.scopeId}>
                    <TableCell>
                      <div className="font-medium">{report.scopeName}</div>
                      <div className="font-mono text-muted-foreground text-xs">
                        {report.scopeId}
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(report.totalCreditsBurned)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(report.burnEvents)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {numberFormat.format(report.boothBookingsSupported)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {vnd.format(report.creditAssistedGmv)}
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
  note
}: {
  title: string
  value: string
  note: string
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="font-semibold text-2xl tabular-nums">
          {value}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground text-xs">{note}</CardContent>
    </Card>
  )
}
