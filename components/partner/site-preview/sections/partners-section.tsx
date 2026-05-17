import Image from "next/image"
import type { TenantRelation } from "../types"

export function PartnersSection({
  relations
}: {
  relations: TenantRelation[]
}) {
  const activeRelations = relations.filter((relation) => relation.active)

  return (
    <section className="bg-white px-6 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <h2
          className="font-bold text-3xl"
          style={{ color: "var(--site-primary)" }}
        >
          Our Partners
        </h2>
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
          {activeRelations.map((relation) => (
            <div
              className="flex aspect-square items-center justify-center rounded-3xl border bg-white p-3"
              key={relation.id}
            >
              {relation.logoUrl ? (
                <Image
                  alt={`${relation.name} logo`}
                  className="max-h-16 max-w-20 object-contain"
                  height={64}
                  src={relation.logoUrl}
                  width={80}
                />
              ) : (
                <span className="text-center font-semibold text-slate-700 text-xs">
                  {relation.name}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
