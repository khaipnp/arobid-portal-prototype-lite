import { supplierCards } from "@/lib/tenant/landing-data"
import {
  PillTabs,
  SectionHeading,
  SectionShell,
  SupplierCard,
  ViewMoreLink
} from "./shared"

export function FeaturedSuppliers() {
  return (
    <SectionShell className="bg-[#f9fafb]">
      <SectionHeading
        title="Featured Suppliers"
        actions={<PillTabs items={["All", "TBSG", "Verified", "Top Rated"]} />}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {supplierCards.map((supplier) => (
          <SupplierCard key={supplier.name} {...supplier} />
        ))}
      </div>
      <div className="mt-6 flex justify-center">
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-6 text-[#1f2937] text-sm"
        >
          View More
        </button>
      </div>
    </SectionShell>
  )
}

export function RecommendedSuppliers() {
  return (
    <SectionShell className="bg-white" innerClassName="space-y-6">
      <SectionHeading
        title="Recommended Suppliers"
        actions={<ViewMoreLink />}
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {supplierCards.map((supplier) => (
          <SupplierCard key={supplier.name} {...supplier} />
        ))}
      </div>
    </SectionShell>
  )
}
