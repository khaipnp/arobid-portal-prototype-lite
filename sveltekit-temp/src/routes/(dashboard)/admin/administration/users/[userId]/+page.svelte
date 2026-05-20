<script lang="ts">
import UserDetailPage from "$lib/components/administration/user-detail-page.svelte"
import DashboardShell from "$lib/components/tradexpo/dashboard-shell.svelte"
import type { PageData } from "./$types"

interface Props {
  data: PageData
}

let { data }: Props = $props()
</script>

<DashboardShell
  title="User Detail"
  breadcrumbs={[
    { label: "Dashboard", href: "/admin" },
    { label: "Administration" },
    { label: "Users", href: "/admin/administration/users" },
    { label: data.user.name }
  ]}
  showBackButton
>
  <UserDetailPage user={data.user} />
</DashboardShell>
