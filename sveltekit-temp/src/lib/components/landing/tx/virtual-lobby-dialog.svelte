<script lang="ts">
import { BoxIcon, X } from "lucide-svelte"
import { Button } from "$lib/components/ui/button/index.js"
import * as Dialog from "$lib/components/ui/dialog/index.js"

let {
  src = "https://arobidglobal.shapespark.com/foodexpo2025_lobby/",
  expoTitle = "Virtual Lobby"
} = $props<{
  src?: string
  expoTitle?: string
}>()

let open = $state(false)
let iframeEl: HTMLIFrameElement | null = null

const autoplaySrc = $derived(
  src.includes("#") ? `${src}&autoplay` : `${src}#autoplay`
)

$effect(() => {
  if (open && iframeEl) {
    const timer = window.setTimeout(() => {
      iframeEl?.focus()
    }, 120)
    return () => window.clearTimeout(timer)
  }
})
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <Button {...props} size="lg" class="bg-legend hover:bg-legend-600">
        <BoxIcon class="size-4" />
        Virtual Lobby
      </Button>
    {/snippet}
  </Dialog.Trigger>
  <Dialog.Content
    class="!top-0 !left-0 !h-screen !w-screen !max-w-none !translate-x-0 !translate-y-0 sm:!max-w-none gap-0 rounded-none p-0 ring-0 ring-transparent"
    showCloseButton={false}
  >
    <Dialog.Title class="sr-only">{expoTitle}</Dialog.Title>
    <Dialog.Description class="sr-only">
      Interactive 3D virtual lobby
    </Dialog.Description>
    <div class="relative flex flex-col h-full">
      <div class="flex h-16 items-center justify-between bg-white px-4 lg:px-8 shrink-0">
        <h2 class="select-none font-semibold text-lg">{expoTitle}</h2>
        <Dialog.Close>
          {#snippet child({ props })}
            <Button {...props} variant="secondary" size="icon" class="rounded-full h-10 w-10">
              <X class="size-4" />
            </Button>
          {/snippet}
        </Dialog.Close>
      </div>
      <iframe
        bind:this={iframeEl}
        title={expoTitle}
        src={autoplaySrc}
        class="flex-1 w-full border-0"
        loading="eager"
        tabindex="-1"
        allow="gyroscope; accelerometer; xr-spatial-tracking; vr;"
        allowfullscreen
      ></iframe>
    </div>
  </Dialog.Content>
</Dialog.Root>
