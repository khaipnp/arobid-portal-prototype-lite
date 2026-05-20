<script lang="ts">
import { onDestroy, onMount } from "svelte"
import { getAssetUrl } from "$lib/image-utils.js"
import { cn } from "$lib/utils.js"
import VirtualLobbyDialog from "./virtual-lobby-dialog.svelte"

export interface HeroExpoItem {
  title: string
  dateLabel: string
  slug: string
  detailHref: string
  virtualLobbyUrl?: string
  backgroundImage?: string
}

let { expos }: { expos: HeroExpoItem[] } = $props()

let current = $state(0)
let intervalId: ReturnType<typeof setInterval> | null = null

const activeExpo = $derived(expos[current])
const nextExpo = $derived(expos[(current + 1) % expos.length])

function scrollTo(index: number) {
  current = ((index % expos.length) + expos.length) % expos.length
}

function scrollNext() {
  current = (current + 1) % expos.length
}

onMount(() => {
  intervalId = setInterval(() => {
    scrollNext()
  }, 10000)
})

onDestroy(() => {
  if (intervalId !== null) clearInterval(intervalId)
})
</script>

{#if expos && expos.length > 0}
  <div class="relative min-h-[616px] w-full overflow-hidden">
    <!-- Background Sliding Layer -->
    <div class="absolute inset-0">
      {#each expos as expo, index}
        <div
          class={cn(
            "absolute inset-0 transition-opacity duration-700",
            current === index ? "opacity-100" : "opacity-0"
          )}
        >
          <img
            src={getAssetUrl(expo.backgroundImage, expo.title, 1920, 1080)}
            alt={expo.title}
            class="size-full object-cover"
          />
        </div>
      {/each}
    </div>

    <!-- Static Overlay Layers -->
    <div class="pointer-events-none absolute inset-0">
      <div class="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-b from-black/0 to-black/80 backdrop-blur-[2px]" />

      <div class="container relative mx-auto flex h-full items-end justify-between gap-8 px-5 pb-10 md:pb-14" style="min-height:616px">
        <!-- Main Content - Updates based on activeExpo -->
        <div class="pointer-events-auto max-w-3xl pb-8 text-white">
          <p class="font-medium text-sm drop-shadow-lg transition-all duration-500">
            {activeExpo.dateLabel}
          </p>
          <h1 class="mt-2 max-w-2xl font-medium text-4xl leading-[1.15] tracking-normal drop-shadow-xl transition-all duration-500 md:text-[36px]">
            {activeExpo.title}
          </h1>

          <div class="mt-8 flex flex-wrap gap-4">
            <VirtualLobbyDialog
              src={activeExpo.virtualLobbyUrl}
              expoTitle={activeExpo.title}
            />
            <a
              href={activeExpo.detailHref}
              class="inline-flex h-10 w-44 items-center justify-center rounded-full border border-white bg-white/10 font-medium text-white backdrop-blur hover:bg-white/20 transition"
            >
              View Detail
            </a>
          </div>

          <!-- Pagination Controls -->
          <div class="mt-6 flex items-end gap-4">
            <div class="font-normal text-lg">
              {String(current + 1).padStart(2, "0")}
              <span class="align-baseline text-[10px]">
                /{String(expos.length).padStart(2, "0")}
              </span>
            </div>
            <div class="mb-2 flex items-center gap-1">
              {#each expos as _, i}
                <button
                  type="button"
                  class={cn(
                    "rounded-full transition-all duration-300",
                    current === i
                      ? "h-1.5 w-6 bg-white"
                      : "size-1.5 bg-white/80"
                  )}
                  onclick={() => scrollTo(i)}
                  aria-label={`Go to slide ${i + 1}`}
                ></button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Right Card for the NEXT expo -->
        {#if expos.length > 1}
          <button
            type="button"
            class="pointer-events-auto mb-8 hidden size-56 cursor-pointer overflow-hidden rounded-2xl bg-white p-1 shadow-2xl transition-all duration-500 hover:scale-105 lg:block"
            onclick={scrollNext}
            aria-label={`Next expo: ${nextExpo.title}`}
          >
            <div class="relative h-28 w-full overflow-hidden rounded-xl">
              <img
                src={getAssetUrl(nextExpo.backgroundImage, nextExpo.title, 400, 225)}
                alt=""
                class="size-full object-cover"
              />
            </div>
            <div class="p-2 text-left">
              <p class="font-medium text-[#6b7280] text-xs">
                {nextExpo.dateLabel}
              </p>
              <h2 class="mt-1 line-clamp-2 font-medium text-sm leading-5">
                {nextExpo.title}
              </h2>
            </div>
          </button>
        {/if}
      </div>
    </div>
  </div>
{/if}
