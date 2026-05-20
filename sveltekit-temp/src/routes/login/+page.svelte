<script lang="ts">
import { Eye, LockKeyhole, Mail } from "lucide-svelte"
import { page } from "$app/state"
import { Button } from "$lib/components/ui/button/index.js"
import { cn } from "$lib/utils.js"

const FIGMA_EXPO_BACKGROUND = "/auth/login-bg.jpg"

const DEMO_ACCOUNTS = [
  {
    label: "Admin",
    email: "khaipham@arobid.com",
    password: "Admin@Arobid123"
  },
  {
    label: "Tenant Owner",
    email: "partner.tenant.owner@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    label: "Tenant Admin",
    email: "partner.tenant.admin@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    label: "Tenant Viewer",
    email: "partner.tenant.viewer@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    label: "Expo Partner Owner",
    email: "partner.demo@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    label: "Alliance Manager",
    email: "partner.alliance.business@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    label: "Government Program",
    email: "partner.gov.program@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    label: "Partner Finance",
    email: "partner.alliance.finance@arobid.com",
    password: "Partner@Arobid123"
  },
  {
    label: "Seller",
    email: "seller.demo@arobid.com",
    password: "Seller@Arobid123"
  },
  {
    label: "Buyer",
    email: "buyer.demo@arobid.com",
    password: "Buyer@Arobid123"
  }
]

// Svelte 5 Runes
let email = $state("")
let password = $state("")
let showPassword = $state(false)
let error = $state("")
let isSubmitting = $state(false)

// Get callbackUrl from SvelteKit page state
const callbackUrl = $derived(page.url.searchParams.get("callbackUrl"))

async function navigateFromResponse(response: Response): Promise<boolean> {
  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    error = payload?.error ?? "Sign-in failed."
    return false
  }

  const redirectPath = callbackUrl ?? payload?.redirectPath ?? "/seller"

  // Redirect via browser location for hard reload (similar to router.refresh())
  window.location.href = redirectPath
  return true
}

async function onSubmit(event: SubmitEvent) {
  event.preventDefault()
  error = ""
  isSubmitting = true
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password })
    })
    const success = await navigateFromResponse(response)
    if (!success) {
      isSubmitting = false
    }
  } catch {
    error = "An unexpected error occurred."
    isSubmitting = false
  }
}

function useDemoAccount(account: (typeof DEMO_ACCOUNTS)[number]) {
  error = ""
  email = account.email
  password = account.password
}
</script>

<main class="relative min-h-screen overflow-hidden bg-white [font-family:var(--font-tight)]">
  <!-- Background Image with Overlay -->
  <div
    class="absolute inset-0 bg-cover bg-center"
    style="background-image: url({FIGMA_EXPO_BACKGROUND})"
  ></div>
  <div class="absolute inset-0 bg-[#022582]/70"></div>

  <!-- Content Container -->
  <div class="relative flex min-h-screen flex-col items-center justify-center px-5 py-10 md:flex-row md:justify-end md:px-[12vw]">
    <div class="flex-1 space-y-5 text-white pr-4 md:pr-10 mb-8 md:mb-0">
      <h3 class="font-semibold text-3xl">
        Empowering B2B Global Trade
      </h3>
      <p class="max-w-md text-lg text-primary-foreground/90 leading-relaxed">
        Unlock efficient global B2B trade. Connect with verified suppliers,
        streamline your procurement processes, and manage transactions
        securely on a unified digital infrastructure.
      </p>
    </div>

    <!-- Login Panel -->
    <section class="relative w-full max-w-lg overflow-hidden rounded-[20px] bg-white px-6 py-8 shadow-[0_0_10px_rgba(0,55,67,0.1)] backdrop-blur md:px-10 md:py-14">
      <p class="absolute top-0 right-0 select-none rounded-bl-xl bg-legend px-3 py-1 font-medium text-white text-xs">
        Demo
      </p>
      
      <div class="space-y-2">
        <h1 class="font-semibold text-4xl text-foreground leading-10">
          Welcome to <span class="text-legend">Arobid</span>
        </h1>
        <p class="text-muted-foreground text-sm leading-5">
          Sign in your enterprise account
        </p>
      </div>

      <form class="mt-10 space-y-4" onsubmit={onSubmit}>
        <!-- Email Field -->
        <div class="space-y-2">
          <label for="email" class="font-medium text-[#000933] text-xs leading-5">
            Email Address
          </label>
          <div class="flex h-12 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 text-muted-foreground focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <span class="grid size-5 place-items-center text-[#64748b]">
              <Mail class="size-4" />
            </span>
            <input
              id="email"
              type="email"
              autocomplete="email"
              bind:value={email}
              placeholder="Enter your email"
              required
              class="h-full w-full border-0 bg-transparent px-0 text-[#000933] text-sm shadow-none placeholder:text-muted-foreground outline-none"
            />
          </div>
        </div>

        <!-- Password Field -->
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label for="password" class="font-medium text-[#000933] text-xs leading-5">
              Password
            </label>
            <a href="/login" class="font-medium text-legend text-xs leading-5 hover:underline">
              Forgot password
            </a>
          </div>
          <div class="flex h-12 items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 text-muted-foreground focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
            <span class="grid size-5 place-items-center text-[#64748b]">
              <LockKeyhole class="size-4" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autocomplete="current-password"
              bind:value={password}
              placeholder="Enter your password"
              required
              class="h-full w-full border-0 bg-transparent px-0 text-[#000933] text-sm shadow-none placeholder:text-muted-foreground outline-none"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onclick={() => showPassword = !showPassword}
              class="grid size-6 shrink-0 place-items-center text-[#64748b] hover:text-foreground outline-none"
            >
              <Eye class="size-4" />
            </button>
          </div>
        </div>

        <!-- Terms and Conditions -->
        <label class="flex items-center gap-2 text-muted-foreground text-xs cursor-pointer select-none">
          <input type="checkbox" required class="accent-legend size-4 rounded" />
          <span>
            By clicking, I accept with
            <a href="/login" class="font-medium text-legend underline hover:text-legend/80">
              Terms and Conditions
            </a>
          </span>
        </label>

        <!-- Error message -->
        {#if error}
          <p class="text-destructive text-sm font-medium">{error}</p>
        {/if}

        <!-- Submit Button -->
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          class="w-full h-11"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <!-- Sign up row -->
      <div class="mt-6 flex items-center justify-center gap-2 text-sm">
        <span class="select-none font-medium text-muted-foreground">
          Don't have an account?
        </span>
        <a href="/login" class="font-medium text-legend hover:underline">
          Sign up
        </a>
      </div>

      <!-- Demo Accounts Picker -->
      <div class="mt-6 border-[#e5e7eb] border-t pt-5">
        <div class="space-y-2">
          <p class="select-none font-medium text-foreground text-sm">Demo accounts</p>
          <div class="grid grid-cols-2 gap-2">
            {#each DEMO_ACCOUNTS as account}
              <Button
                disabled={isSubmitting}
                onclick={() => useDemoAccount(account)}
                variant="outline"
                size="sm"
                class="rounded-full text-xs font-normal"
              >
                {account.label}
              </Button>
            {/each}
          </div>
        </div>
      </div>
    </section>
  </div>
</main>
