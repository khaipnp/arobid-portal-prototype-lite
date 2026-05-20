<script lang="ts">
import AdministrationListPage from "$lib/components/administration/administration-list-page.svelte"
import DashboardShell from "$lib/components/tradexpo/dashboard-shell.svelte"
import type { PageData } from "./$types"

interface Props {
  data: PageData
}

let { data }: Props = $props()
</script>

<DashboardShell
  title="Users"
  breadcrumbs={[
    { label: "Dashboard", href: "/admin" },
    { label: "Administration" },
    { label: "Users" }
  ]}
>
  <AdministrationListPage entity="users" initialData={data.initialData} />
</DashboardShell>
