import { cn } from "@/lib/utils"

export function Partners() {
  const strategic = [
    "V",
    "VTTA",
    "ITPC",
    "HCMC",
    "CSED",
    "ISC",
    "HMEA",
    "VIFSA",
    "WISA",
    "KORETOVIET"
  ]
  const alliance = [
    "ACCG",
    "OCEAN USA",
    "VIC",
    "Viet",
    "EcoHub",
    "Camel",
    "Kocham",
    "High West",
    "Jardin",
    "Bamboo"
  ]

  return (
    <section className="bg-white px-5 py-16 text-center">
      <h2 className="font-bold text-[32px] leading-10">Partners</h2>
      <p className="mt-10 font-medium">Strategic Partners</p>
      <div className="mx-auto mt-6 flex max-w-[900px] flex-wrap justify-center gap-x-[70px] gap-y-8">
        {strategic.map((name) => (
          <LogoTile key={name} name={name} />
        ))}
      </div>
      <p className="mt-12 font-medium">
        Alliance Partners - Procurement Partners - Top Brands
      </p>
      <div className="mt-6 flex gap-10 overflow-hidden">
        {[
          ...alliance.map((name) => `first-${name}`),
          ...alliance.map((name) => `second-${name}`)
        ].map((id) => (
          <LogoTile key={id} name={id.replace(/^(first|second)-/, "")} small />
        ))}
      </div>
    </section>
  )
}

function LogoTile({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-lg bg-white font-bold shadow-sm",
        small ? "size-16 text-[11px]" : "size-20 text-sm"
      )}
    >
      <span className="text-[#ed6203]">{name}</span>
    </div>
  )
}
