<script lang="ts">
import { Activity, Eye, RadioTower, Users } from "lucide-svelte"
import DashboardShell from "$lib/components/tradexpo/dashboard-shell.svelte"
import StatusBadge from "$lib/components/tradexpo/status-badge.svelte"
import { Badge } from "$lib/components/ui/badge"
import * as Card from "$lib/components/ui/card"
import * as Table from "$lib/components/ui/table"
import type { PartnerDashboardMetrics } from "$lib/partner/db"

interface Props {
  data: {
    metrics: PartnerDashboardMetrics
    summary: any
  }
}

let { data }: Props = $props()

const compactNumber = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1
})

const numberFormat = new Intl.NumberFormat("en")

const currencyFormat = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  notation: "compact",
  maximumFractionDigits: 1
})

function formatPercent(value: number) {
  return `${Math.round(value)}%`
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short"
  })
}

function shortName(name: string) {
  const words = name.split(/\s+/).filter(Boolean)
  if (words.length <= 2) return name
  return words.slice(0, 2).join(" ")
}

const expoChartData = $derived(
  data.metrics.expoMetrics.map((item) => ({
    ...item,
    label: shortName(item.expoName)
  }))
)
const hasExpoMetrics = $derived(data.metrics.expoMetrics.length > 0)
const hasCountryData = $derived(data.metrics.countryBreakdown.length > 0)
const hasTierData = $derived(data.metrics.boothTierBreakdown.length > 0)
const totalRevenue = $derived(
  data.metrics.expoMetrics.reduce((sum, item) => sum + item.revenue, 0)
)
</script>

<DashboardShell breadcrumbs={[{ label: "Dashboard" }]}>
  <div class="space-y-6">
    <section class="overflow-hidden rounded-3xl border bg-legend text-primary-foreground shadow-sm">
      <div class="grid gap-5 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.28),_transparent_34rem)] p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div class="flex min-h-52 flex-col justify-between gap-6">
          <div class="space-y-4">
            <div class="space-y-3">
              <h1 class="max-w-3xl font-semibold text-3xl tracking-tight sm:text-4xl lg:text-[2.65rem] text-white">
                Partner Analytics Command Center
              </h1>
              <p class="max-w-2xl text-primary-foreground/75 text-sm leading-6 sm:text-base text-zinc-100">
                Follow capacity, activation, revenue, and live engagement signals across assigned Expo Programs.
              </p>
            </div>
          </div>
        </div>
        <div class="w-full flex items-start gap-5 self-start xl:gap-3">
          <div class="w-1/2 grid grid-cols-3 gap-3 xl:grid-cols-1">
            <div class="rounded-2xl border border-white/20 bg-white/10 p-4 text-primary-foreground shadow-sm backdrop-blur">
              <div class="mb-3 flex items-center gap-2 text-primary-foreground/75 text-sm font-semibold text-zinc-200">
                <Eye class="size-4" />
                <span>Visitor traffic</span>
              </div>
              <div class="font-semibold text-xl tabular-nums tracking-tight text-white">
                {numberFormat.format(data.metrics.totals.liveExpos * 1234)}
              </div>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 p-4 text-primary-foreground shadow-sm backdrop-blur">
              <div class="mb-3 flex items-center gap-2 text-primary-foreground/75 text-sm font-semibold text-zinc-200">
                <Users class="size-4" />
                <span>Members</span>
              </div>
              <div class="font-semibold text-xl tabular-nums tracking-tight text-white">
                {numberFormat.format(data.metrics.totals.liveExpos * 42)}
              </div>
            </div>
          </div>

          <div class="w-1/2 grid grid-cols-3 gap-3 xl:grid-cols-1">
            <div class="rounded-2xl border border-white/20 bg-white/10 p-4 text-primary-foreground shadow-sm backdrop-blur">
              <div class="mb-3 flex items-center gap-2 text-primary-foreground/75 text-sm font-semibold text-zinc-200">
                <RadioTower class="size-4" />
                <span>Live expos</span>
              </div>
              <div class="font-semibold text-xl tabular-nums tracking-tight text-white">
                {numberFormat.format(data.metrics.totals.liveExpos)}
              </div>
            </div>
            <div class="rounded-2xl border border-white/20 bg-white/10 p-4 text-primary-foreground shadow-sm backdrop-blur">
              <div class="mb-3 flex items-center gap-2 text-primary-foreground/75 text-sm font-semibold text-zinc-200">
                <Activity class="size-4" />
                <span>Booth usage</span>
              </div>
              <div class="font-semibold text-xl tabular-nums tracking-tight text-white">
                {formatPercent(data.metrics.totals.boothUtilization)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div class="grid gap-4 xl:grid-cols-3">
      <div class="col-span-2 overflow-x-auto rounded-2xl border bg-card">
        <Table.Root class="min-w-2/3">
          <Table.Header>
            <Table.Row>
              <Table.Head>Expo Program</Table.Head>
              <Table.Head>Status</Table.Head>
              <Table.Head class="text-right">Quota used</Table.Head>
              <Table.Head class="text-right">Utilization</Table.Head>
              <Table.Head class="text-right">Published</Table.Head>
              <Table.Head class="text-right">Views</Table.Head>
              <Table.Head class="text-right">Revenue</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each data.metrics.expoMetrics as item}
              <Table.Row>
                <Table.TableCell class="max-w-72 whitespace-normal py-4 font-medium">
                  <a
                    href={`/partner/expos/${item.expoId}`}
                    class="underline-offset-4 hover:underline text-primary"
                  >
                    {item.expoName}
                  </a>
                  <div class="text-muted-foreground text-xs">
                    {formatDate(item.startDate)} - {formatDate(item.endDate)}
                  </div>
                </Table.TableCell>
                <Table.TableCell>
                  <StatusBadge status={item.status} />
                </Table.TableCell>
                <Table.TableCell class="text-right tabular-nums">
                  {numberFormat.format(item.soldBooths)} / {numberFormat.format(item.totalBooths)}
                </Table.TableCell>
                <Table.TableCell class="text-right font-medium tabular-nums">
                  {formatPercent(item.boothUtilization)}
                </Table.TableCell>
                <Table.TableCell class="text-right tabular-nums">
                  {numberFormat.format(item.publishedBooths)}
                </Table.TableCell>
                <Table.TableCell class="text-right tabular-nums">
                  {compactNumber.format(item.peakViewers)}
                </Table.TableCell>
                <Table.TableCell class="text-right tabular-nums">
                  {currencyFormat.format(item.revenue)}
                </Table.TableCell>
              </Table.Row>
            {/each}
            {#if data.metrics.expoMetrics.length === 0}
              <Table.Row>
                <Table.TableCell colspan={7} class="h-32 text-center">
                  <div class="flex flex-col items-center gap-3 text-muted-foreground">
                    <span>No assigned expo programs available yet.</span>
                    <a
                      href="/partner/expos"
                      class="rounded-md border px-3 py-2 font-medium text-foreground text-sm underline-offset-4 hover:underline"
                    >
                      Go to Expo Programs
                    </a>
                  </div>
                </Table.TableCell>
              </Table.Row>
            {/if}
          </Table.Body>
        </Table.Root>
      </div>

      <Card.Root>
        <Card.Header>
          <Card.Description>Activation proxies</Card.Description>
          <Card.Title>Enterprise Demand</Card.Title>
        </Card.Header>
        <Card.Content class="space-y-6">
          <section class="space-y-3">
            <div class="flex items-center gap-2 font-medium text-sm text-foreground">
              <Users class="h-4 w-4 text-primary" />
              <span>Company geography</span>
            </div>
            {#if !hasCountryData}
              <div class="rounded-xl border border-dashed bg-muted/20 p-4 text-muted-foreground text-sm">
                No data yet.
              </div>
            {:else}
              <div class="space-y-3">
                {#each data.metrics.countryBreakdown as item}
                  {@const total = data.metrics.countryBreakdown.reduce((sum, i) => sum + i.value, 0)}
                  {@const percent = total > 0 ? (item.value / total) * 100 : 0}
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between gap-3 text-sm">
                      <span class="truncate font-medium">{item.name}</span>
                      <span class="font-mono text-muted-foreground text-xs tabular-nums">
                        {numberFormat.format(item.value)} · {formatPercent(percent)}
                      </span>
                    </div>
                    <div class="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: {percent}%"
                      />
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </section>

          <section class="space-y-3">
            <div class="flex items-center gap-2 font-medium text-sm text-foreground">
              <Users class="h-4 w-4 text-primary" />
              <span>Booth tier demand</span>
            </div>
            {#if !hasTierData}
              <div class="rounded-xl border border-dashed bg-muted/20 p-4 text-muted-foreground text-sm">
                No data yet.
              </div>
            {:else}
              <div class="space-y-3">
                {#each data.metrics.boothTierBreakdown as item}
                  {@const total = data.metrics.boothTierBreakdown.reduce((sum, i) => sum + i.value, 0)}
                  {@const percent = total > 0 ? (item.value / total) * 100 : 0}
                  <div class="space-y-1.5">
                    <div class="flex items-center justify-between gap-3 text-sm">
                      <span class="truncate font-medium">{item.name}</span>
                      <span class="font-mono text-muted-foreground text-xs tabular-nums">
                        {numberFormat.format(item.value)} · {formatPercent(percent)}
                      </span>
                    </div>
                    <div class="h-2.5 overflow-hidden rounded-full bg-muted">
                      <div
                        class="h-full rounded-full bg-primary"
                        style="width: {percent}%"
                      />
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </section>
        </Card.Content>
      </Card.Root>
    </div>
  </div>
</DashboardShell>
