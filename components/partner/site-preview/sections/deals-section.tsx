import Image from "next/image"

export function DealsSection({ media = [] }: { media?: string[] }) {
  return (
    <section className="bg-slate-50 px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-3 py-1 font-bold text-sm text-white"
            style={{ backgroundColor: "var(--site-primary)" }}
          >
            HOT DEAL
          </span>
          <h2 className="font-bold text-2xl text-slate-950">
            eVoucher and Deals
          </h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_2fr]">
          <DealCard imageUrl={media[0]} large title="Top Ranking" />
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              "Buyer services",
              "Supplier boost",
              "Expo package",
              "Member deals"
            ].map((deal, index) => (
              <DealCard key={deal} imageUrl={media[index + 1]} title={deal} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function DealCard({
  imageUrl,
  large,
  title
}: {
  imageUrl?: string
  large?: boolean
  title: string
}) {
  return (
    <div className="relative flex min-h-48 flex-col justify-end overflow-hidden rounded-3xl bg-slate-900 p-6 text-white">
      {imageUrl ? (
        <Image
          alt=""
          className="object-cover opacity-55"
          fill
          sizes={large ? "384px" : "320px"}
          src={imageUrl}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 to-slate-950/10" />
      <div className="relative space-y-3">
        <h3 className="font-bold text-2xl">{title}</h3>
        <button
          className="rounded-full px-4 py-2 font-semibold text-sm text-white"
          style={{ backgroundColor: "var(--site-primary)" }}
          type="button"
        >
          {large ? "Claim top deal" : "Claim now"}
        </button>
      </div>
    </div>
  )
}
