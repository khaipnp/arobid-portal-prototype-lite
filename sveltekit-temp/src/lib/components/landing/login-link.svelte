<script lang="ts">
import { page } from "$app/stores"
import { Button } from "$lib/components/ui/button/index.js"

let loginUrl = $derived.by(() => {
  const pathname = $page.url.pathname
  return pathname === "/login"
    ? "/login"
    : `/login?callbackUrl=${encodeURIComponent(pathname)}`
})
</script>

<a href={loginUrl}>
  <Button variant="ghost" class="font-medium">
    Login or Sign up
  </Button>
</a>
