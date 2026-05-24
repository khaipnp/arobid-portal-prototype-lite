import { productCards } from "@/lib/tenant/landing-data"
import {
  PillTabs,
  ProductCard,
  SectionHeading,
  SectionShell,
  ViewMoreLink
} from "./shared"

export function ProductSection({
  title,
  withTabs = false,
  secondary = false
}: {
  title: string
  withTabs?: boolean
  secondary?: boolean
}) {
  return (
    <SectionShell className={secondary ? "bg-[#f9fafb]" : "bg-white"}>
      <SectionHeading
        title={title}
        actions={
          withTabs ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <PillTabs
                items={["All", "Trending", "New Arrivals", "Top Rated"]}
              />
              <ViewMoreLink />
            </div>
          ) : (
            <ViewMoreLink />
          )
        }
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {productCards.map((product) => (
          <ProductCard key={`${title}-${product.title}`} {...product} />
        ))}
      </div>
    </SectionShell>
  )
}
