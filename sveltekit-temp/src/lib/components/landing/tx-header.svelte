<script lang="ts">
import LoginLink from "./login-link.svelte"
import UserMenu from "./user-menu.svelte"

let { user = null } = $props<{
  user?: {
    id: string
    name: string
    email: string
    roles: string[]
  } | null
}>()
</script>

<header class="sticky top-0 z-50 h-16 border-black/5 border-b bg-white/95 backdrop-blur">
  <section class="container mx-auto flex h-full items-center gap-8 px-5">
    <a href="/" aria-label="Arobid TradeXpo" class="flex items-center">
      <img
        src="/landing/logo.svg"
        alt="Arobid logo"
        class="h-10 w-auto"
      />
    </a>
    <nav class="hidden flex-1 items-center gap-8 font-medium text-sm md:flex">
      <a href="#shows" class="hover:text-legend-500 text-foreground transition">
        Virtual Shows
      </a>
      <a href="#ecosystem" class="hover:text-legend-500 text-foreground transition">
        Ecosystem
      </a>
      <a href="#pricing" class="hover:text-legend-500 text-foreground transition">
        Pricing
      </a>
    </nav>
    <div class="ml-auto flex items-center gap-4">
      {#if user}
        <UserMenu {user} />
      {:else}
        <LoginLink />
      {/if}
    </div>
  </section>
</header>
