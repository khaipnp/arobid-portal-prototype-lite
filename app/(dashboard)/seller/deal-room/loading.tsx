import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Skeleton */}
      <aside className="flex w-72 shrink-0 flex-col border-r">
        <div className="flex h-14 items-center border-b px-4">
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2 p-2">
          <Skeleton className="h-8 w-full rounded-md" />
          <div className="grid grid-cols-2 gap-1">
            <Skeleton className="h-7 w-full rounded-sm" />
            <Skeleton className="h-7 w-full rounded-sm" />
          </div>
        </div>
        <div className="flex-1 space-y-4 overflow-hidden p-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* Content Skeleton */}
      <main className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-6 p-6">
          <div className="flex justify-start">
            <Skeleton className="h-10 w-[40%] rounded-2xl" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-[30%] rounded-2xl" />
          </div>
          <div className="flex justify-start">
            <Skeleton className="h-16 w-[50%] rounded-2xl" />
          </div>
          <div className="flex justify-center py-4">
            <Skeleton className="h-4 w-24 rounded-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-[35%] rounded-2xl" />
          </div>
        </div>
        <div className="border-t p-3">
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </main>
    </div>
  )
}
