<script lang="ts">
import type { AdministrationUserDetail } from "$lib/administration/user-detail"
import { Badge } from "$lib/components/ui/badge"
import * as Card from "$lib/components/ui/card"
import UserAvatar from "$lib/components/user-avatar.svelte"

interface Props {
  user: AdministrationUserDetail
}

let { user }: Props = $props()

const statusLabel = $derived(user.isActive ? "Active" : "Inactive")

function formatDateTime(value: string | null) {
  if (!value) return "—"
  return new Date(value).toLocaleString()
}

function formatAction(value: string) {
  return value.replaceAll(".", " · ").replaceAll("_", " ")
}

function formatMetadata(metadata: Record<string, unknown>) {
  const entries = Object.entries(metadata)
  if (entries.length === 0) return "—"
  return entries
    .slice(0, 3)
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ")
}
</script>

<div class="mt-4 space-y-6">
  <Card.Root>
    <Card.Content class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-4">
        <UserAvatar name={user.name} class="h-16 w-16 text-lg" />
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="font-semibold text-2xl tracking-tight">{user.name}</h1>
            <Badge variant={user.isActive ? "default" : "secondary"}>
              {statusLabel}
            </Badge>
          </div>
          <p class="text-muted-foreground text-sm">{user.email}</p>
          <p class="text-muted-foreground text-sm">
            {user.companyName ?? "No company assigned"}
          </p>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-3 md:min-w-80">
        <div class="rounded-2xl border bg-muted/30 p-3">
          <p class="text-muted-foreground text-xs uppercase tracking-wide">Roles</p>
          <p class="font-semibold text-2xl tabular-nums">{user.roleCount}</p>
        </div>
        <div class="rounded-2xl border bg-muted/30 p-3">
          <p class="text-muted-foreground text-xs uppercase tracking-wide">Audit events</p>
          <p class="font-semibold text-2xl tabular-nums">{user.auditEventCount}</p>
        </div>
      </div>
    </Card.Content>
  </Card.Root>

  <div class="grid gap-4 lg:grid-cols-3">
    <Card.Root class="lg:col-span-2">
      <Card.Header>
        <Card.Title>Profile</Card.Title>
        <Card.Description>Core account and organization data.</Card.Description>
      </Card.Header>
      <Card.Content>
        <dl class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">User ID</dt>
            <dd class="break-all font-mono text-xs">{user.id}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Email</dt>
            <dd class="text-sm">{user.email}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Company</dt>
            <dd class="text-sm">{user.companyName ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Company ID</dt>
            <dd class="break-all font-mono text-xs">{user.companyId ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Job title</dt>
            <dd class="text-sm">{user.jobTitle ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Industry</dt>
            <dd class="text-sm">{user.industry ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Phone</dt>
            <dd class="text-sm">{user.phone ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Location</dt>
            <dd class="text-sm">{user.location ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Website</dt>
            <dd class="text-sm">{user.website ?? "—"}</dd>
          </div>
          <div class="space-y-1">
            <dt class="text-muted-foreground text-xs uppercase tracking-wide">Latest audit activity</dt>
            <dd class="text-sm">{formatDateTime(user.latestActivityAt)}</dd>
          </div>
        </dl>
      </Card.Content>
    </Card.Root>

    <Card.Root>
      <Card.Header>
        <Card.Title>Roles</Card.Title>
        <Card.Description>Global and scoped permissions.</Card.Description>
      </Card.Header>
      <Card.Content>
        {#if user.roles.length === 0}
          <p class="text-muted-foreground text-sm">No roles assigned.</p>
        {:else}
          <div class="space-y-3">
            {#each user.roles as role (`${role.roleId}-${role.expoId ?? "global"}`)}
              <div class="rounded-2xl border p-3">
                <div class="flex items-center justify-between gap-2">
                  <p class="font-medium">{role.roleName}</p>
                  <Badge variant="outline">{role.scope}</Badge>
                </div>
                <p class="mt-1 font-mono text-muted-foreground text-xs">
                  {role.expoId ?? "global"}
                </p>
              </div>
            {/each}
          </div>
        {/if}
      </Card.Content>
    </Card.Root>
  </div>

  <Card.Root>
    <Card.Header>
      <Card.Title>Audit & tracking</Card.Title>
      <Card.Description>
        Newest user-related events from admin, auth, and domain modules.
      </Card.Description>
    </Card.Header>
    <Card.Content>
      {#if user.auditEvents.length === 0}
        <div class="flex min-h-48 items-center justify-center rounded-md border border-dashed text-muted-foreground text-sm">
          No audit events found.
        </div>
      {:else}
        <div class="overflow-hidden rounded-2xl border">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="border-b bg-muted/40">
                <tr class="text-left">
                  <th class="px-4 py-3 font-medium">Timestamp</th>
                  <th class="px-4 py-3 font-medium">Action</th>
                  <th class="px-4 py-3 font-medium">Actor</th>
                  <th class="px-4 py-3 font-medium">Resource</th>
                  <th class="px-4 py-3 font-medium">Summary</th>
                  <th class="px-4 py-3 font-medium">Metadata</th>
                </tr>
              </thead>
              <tbody>
                {#each user.auditEvents as event (event.id)}
                  <tr class="border-b last:border-b-0">
                    <td class="whitespace-nowrap px-4 py-3 text-xs">
                      {formatDateTime(event.createdAt)}
                    </td>
                    <td class="px-4 py-3">
                      <Badge variant="outline">{formatAction(event.action)}</Badge>
                    </td>
                    <td class="px-4 py-3">
                      <p class="font-medium">{event.actorName ?? event.actorType}</p>
                      <p class="text-muted-foreground text-xs">
                        {event.actorEmail ?? event.actorUserId ?? "—"}
                      </p>
                    </td>
                    <td class="px-4 py-3">
                      <p>{event.resourceType ?? "—"}</p>
                      <p class="font-mono text-muted-foreground text-xs">
                        {event.resourceId ?? "—"}
                      </p>
                    </td>
                    <td class="max-w-72 px-4 py-3">{event.summary}</td>
                    <td class="max-w-64 px-4 py-3 text-muted-foreground text-xs">
                      {formatMetadata(event.metadata)}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}
    </Card.Content>
  </Card.Root>
</div>
