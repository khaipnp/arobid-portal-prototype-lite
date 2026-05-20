<script lang="ts">
import { ChevronLeft } from "lucide-svelte"
import type { Snippet } from "svelte"
import * as Breadcrumb from "$lib/components/ui/breadcrumb"
import { Button } from "$lib/components/ui/button"
import { Separator } from "$lib/components/ui/separator"
import { SidebarTrigger } from "$lib/components/ui/sidebar"

interface Crumb {
  label: string
  href?: string
}

interface Props {
  title?: string
  description?: string
  breadcrumbs: Crumb[]
  children?: Snippet
  showBackButton?: boolean
}

let {
  title,
  description,
  breadcrumbs,
  children,
  showBackButton = false
}: Props = $props()

const lastIndex = $derived(breadcrumbs.length - 1)
</script>

<div class="flex h-dvh flex-col overflow-hidden">
  <nav class="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-11">
    <div class="flex w-full items-center justify-between gap-2 px-4">
      <div class="flex items-center gap-1">
        <SidebarTrigger class="-ml-1 rounded-full" />
        <Separator
          orientation="vertical"
          class="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb.Root>
          <Breadcrumb.List>
            {#each breadcrumbs as crumb, index}
              <Breadcrumb.Item>
                {#if index === lastIndex}
                  <Breadcrumb.Page class="select-none font-medium">
                    {crumb.label}
                  </Breadcrumb.Page>
                {:else}
                  <Breadcrumb.Link href={crumb.href || "#"}>
                    {crumb.label}
                  </Breadcrumb.Link>
                {/if}
              </Breadcrumb.Item>
              {#if index < lastIndex}
                <Breadcrumb.Separator />
              {/if}
            {/each}
          </Breadcrumb.List>
        </Breadcrumb.Root>
      </div>
    </div>
  </nav>

  <main class="min-h-0 flex-1 overflow-y-auto">
    <div class="flex min-h-full flex-col p-4 lg:px-10">
      {#if title}
        <div class="flex items-center gap-4 mb-4">
          {#if showBackButton}
            <Button
              type="button"
              variant="secondary"
              size="icon"
              aria-label="Go back"
              onclick={() => window.history.back()}
            >
              <ChevronLeft class="size-4" />
            </Button>
          {/if}
          <section>
            <h1 class="font-semibold text-xl">{title}</h1>
            {#if description}
              <p class="text-muted-foreground text-sm">{description}</p>
            {/if}
          </section>
        </div>
      {/if}
      {@render children?.()}
    </div>
  </main>
</div>
