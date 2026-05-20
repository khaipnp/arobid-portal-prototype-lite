<script lang="ts">
import DashboardShell from "$lib/components/tradexpo/dashboard-shell.svelte"

interface Props {
  data: {
    isSeller: boolean
    myExpoIdsLength: number
    liveCount: number
    pendingCount: number
  }
}

let { data }: Props = $props()
</script>

<DashboardShell
  title="User Workspace Dashboard"
  description="Manage your booths and browse expo events."
  breadcrumbs={[{ label: "Dashboard" }]}
>
  <div class="grid gap-4 px-4 md:grid-cols-3">
    <a
      href="/seller/orders"
      class="group rounded-xl border bg-card p-4 transition-all duration-300 hover:bg-accent/40 hover:shadow-md hover:border-primary/50"
    >
      <div class="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-history"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/></svg>
      </div>
      <p class="font-semibold text-base text-foreground group-hover:text-primary transition-colors">Order History</p>
      <p class="mt-0.5 text-muted-foreground text-sm">
        Review your checkout and payment results.
      </p>
    </a>

    {#if data.isSeller}
      <a
        href="/seller/my-expos"
        class="group rounded-xl border bg-card p-4 transition-all duration-300 hover:bg-accent/40 hover:shadow-md hover:border-primary/50"
      >
        <p class="font-bold text-4xl text-foreground group-hover:text-primary transition-colors tracking-tight">{data.myExpoIdsLength}</p>
        <p class="mt-2 font-semibold text-base">Expos Joined</p>
        <p class="mt-0.5 text-muted-foreground text-sm">
          Expos where you have purchased a booth.
        </p>
      </a>

      <a
        href="/seller/my-expos"
        class="group rounded-xl border bg-card p-4 transition-all duration-300 hover:bg-accent/40 hover:shadow-md hover:border-emerald-500/50"
      >
        <p class="font-bold text-4xl text-emerald-600 dark:text-emerald-400 tracking-tight">{data.liveCount}</p>
        <p class="mt-2 font-semibold text-base">Active Booths</p>
        <p class="mt-0.5 text-muted-foreground text-sm">
          Booths currently live at an ongoing expo.
        </p>
      </a>

      <a
        href="/seller/my-expos"
        class="group rounded-xl border bg-card p-4 transition-all duration-300 hover:bg-accent/40 hover:shadow-md hover:border-amber-500/50"
      >
        <p class="font-bold text-4xl text-amber-600 dark:text-amber-400 tracking-tight">{data.pendingCount}</p>
        <p class="mt-2 font-semibold text-base">Pending Setup</p>
        <p class="mt-0.5 text-muted-foreground text-sm">
          Booths awaiting configuration before the expo.
        </p>
      </a>
    {/if}
  </div>
</DashboardShell>
