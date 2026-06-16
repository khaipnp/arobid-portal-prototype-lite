export default function PartnerLoading() {
  return (
    <div
      className="flex h-dvh flex-col overflow-hidden"
      aria-busy="true"
      aria-live="polite"
    >
      <nav className="sticky top-0 z-10 flex h-11 shrink-0 items-center gap-2 border-b bg-background">
        <div className="flex w-full items-center justify-between gap-2 px-4">
          <div className="flex items-center gap-3">
            <div className="size-5 rounded-full bg-muted" />
            <div className="h-4 w-40 rounded bg-muted" />
          </div>
          <div className="size-7 rounded-full bg-muted" />
        </div>
      </nav>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="flex min-h-full animate-pulse flex-col gap-6 p-4 lg:px-18 lg:py-6">
          <div className="space-y-2">
            <div className="h-7 w-64 rounded-lg bg-muted" />
            <div className="h-4 w-96 max-w-full rounded bg-muted" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {["a", "b", "c", "d"].map((key) => (
              <div
                key={key}
                className="h-32 rounded-2xl border bg-card p-5 shadow-xs"
              >
                <div className="h-4 w-28 rounded bg-muted" />
                <div className="mt-10 h-8 w-20 rounded bg-muted" />
              </div>
            ))}
          </div>

          <div className="rounded-2xl border bg-card p-5 shadow-xs">
            <div className="h-5 w-48 rounded bg-muted" />
            <div className="mt-5 space-y-3">
              {["r1", "r2", "r3", "r4", "r5"].map((key) => (
                <div key={key} className="h-10 w-full rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
