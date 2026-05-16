import { ArrowUpRightIcon } from "lucide-react"
import { communityStats, featureNames } from "../constants"

export function CommunitySection() {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              className="font-bold text-4xl"
              style={{ color: "var(--site-primary)" }}
            >
              The Power of TBSG Community
            </h2>
          </div>
          <button
            className="rounded-full px-5 py-2 font-semibold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
            type="button"
          >
            Explore more
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          {communityStats.map(([value, label]) => (
            <div className="border-l pl-4" key={label}>
              <div className="font-bold text-3xl text-slate-950">{value}</div>
              <div className="text-slate-500 text-sm">{label}</div>
            </div>
          ))}
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {featureNames.map(([title, text], index) => (
            <div
              className="group flex min-h-32 items-end justify-between rounded-3xl bg-white p-6 shadow-sm"
              key={title}
            >
              <div>
                <h3 className="font-semibold text-xl text-slate-950">
                  {title}
                </h3>
                <p className="text-slate-500 text-sm">{text}</p>
              </div>
              <div
                className="flex size-10 items-center justify-center rounded-full text-white"
                style={{
                  backgroundColor:
                    index % 2 === 0
                      ? "var(--site-primary)"
                      : "var(--site-accent)"
                }}
              >
                <ArrowUpRightIcon className="size-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
