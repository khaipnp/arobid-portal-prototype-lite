import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-950 px-6 py-16">
      <div className="absolute top-0 left-1/2 h-64 w-[42rem] -translate-x-1/2 rounded-full/20 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-sky-500/20 blur-3xl" />

      <section className="relative mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur-xl">
        <p className="font-mono text-orange-300/90 text-xs tracking-[0.3em]">
          ERROR 404
        </p>
        <h1 className="mt-4 font-semibold text-3xl text-white tracking-tight">
          This page took the wrong turn
        </h1>
        <p className="mt-3 text-slate-300 text-sm leading-6">
          The page you requested does not exist, may have been removed, or is
          temporarily unavailable.
        </p>

        <div className="mt-8 flex flex-1 items-center justify-center gap-3">
          <Link href="/admin">
            <Button variant="outline">Admin Portal</Button>
          </Link>
          <Link href="/partner">
            <Button variant="outline">Partner Portal</Button>
          </Link>
          <Link href="/seller">
            <Button variant="outline">User Workspace Portal</Button>
          </Link>
        </div>

        <p className="mt-6 text-slate-400 text-xs">
          Tip: check the URL or use the navigation menu.
        </p>
      </section>
    </main>
  )
}
