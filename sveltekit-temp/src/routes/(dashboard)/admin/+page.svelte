<script lang="ts">
import DashboardShell from "$lib/components/tradexpo/dashboard-shell.svelte"
</script>

<DashboardShell
  title="Admin Dashboard"
  description="Access module workspaces and manage feature libraries for TradeXpo."
  breadcrumbs={[{ label: "Dashboard" }]}
>
  <div class="mt-4 flex flex-col items-center justify-center p-8 rounded-xl border border-dashed text-center bg-card shadow-sm min-h-[400px]">
    <div class="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-check"><path d="M20 13c0 5-3.5 7.5-7.66 9.7a1 1 0 0 1-.68 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>
    </div>
    <h2 class="font-semibold text-lg text-foreground">Chào mừng quay trở lại, Admin!</h2>
    <p class="text-sm text-muted-foreground mt-2 max-w-sm">
      Hệ thống đã chuyển đổi hoàn toàn sang SvelteKit 5 với hiệu năng siêu tốc và kiến trúc Runes tối tân. Hãy bắt đầu quản lý từ thanh menu bên trái.
    </p>
  </div>
</DashboardShell>
