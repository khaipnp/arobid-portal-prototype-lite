<script lang="ts">
import BoothSteps from "$lib/components/landing/tx/booth-steps.svelte"
import Ecosystem from "$lib/components/landing/tx/ecosystem.svelte"
import Exhibitions from "$lib/components/landing/tx/exhibitions.svelte"
import Faqs from "$lib/components/landing/tx/faqs.svelte"
import Hero from "$lib/components/landing/tx/hero.svelte"
import Introduction from "$lib/components/landing/tx/introduction.svelte"
import Partners from "$lib/components/landing/tx/partners.svelte"
import Pricing from "$lib/components/landing/tx/pricing.svelte"
import Sponsors from "$lib/components/landing/tx/sponsors.svelte"
import TxFooter from "$lib/components/landing/tx-footer.svelte"
import TxHeader from "$lib/components/landing/tx-header.svelte"
import type { PageData } from "./$types"

let { data } = $props<{ data: PageData }>()
</script>

<svelte:head>
  <title>Arobid TradeXpo - AI-Powered Virtual Trade Ecosystem</title>
  <meta
    name="description"
    content="Connect with 50,000+ global buyers and sellers through AI-powered virtual exhibitions. Book your virtual booth today."
  />
</svelte:head>

<main class="min-h-screen bg-white text-[#030712]" style="font-family: 'Outfit', sans-serif;">
  <TxHeader user={data.user} />
  <Hero expos={data.heroExpos} />
  <Exhibitions
    categories={data.categories}
    expos={data.expoCards}
    isAuthenticated={data.isAuthenticated}
  />
  <Introduction />
  <Pricing />
  <BoothSteps />
  <Ecosystem />
  <Partners />
  <Sponsors />
  <Faqs />
  <TxFooter />
</main>
