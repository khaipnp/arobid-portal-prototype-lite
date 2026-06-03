import Image from "next/image"

export function BfmSection({ media = [] }: { media?: string[] }) {
  const imageUrl = media[0]

  return (
    <section className="bg-white px-6 py-16">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2
              className="font-bold text-4xl text-slate-950"
              style={{ color: "var(--site-primary)" }}
            >
              Buyer Find & Match
            </h2>
            <p className="text-lg text-slate-600 leading-8">
              Instantly connecting standardized supplier data with verified
              buyer intent for absolute precision in global sourcing.
            </p>
          </div>
          <button
            className="rounded-full px-5 py-3 font-semibold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
            type="button"
          >
            Find matches now
          </button>
        </div>
        <div className="rounded-[2rem] bg-slate-100 p-4">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[1.5rem] bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.24),transparent_32%),linear-gradient(135deg,#f8fafc,#e2e8f0)]">
            {imageUrl ? (
              <Image
                alt=""
                className="object-cover"
                fill
                sizes="576px"
                src={imageUrl}
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}
