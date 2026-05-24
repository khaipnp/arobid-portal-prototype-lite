import { CheckCircle2 } from "lucide-react"
import { footerColumns, tenantAssets } from "@/lib/tenant/landing-data"
import { TBSGLogo } from "./shared"

export function TenantFooter() {
  return (
    <footer className="border-[#f3f4f6] border-t bg-white px-5 py-11 md:px-8 lg:px-[72px]">
      <div className="mx-auto max-w-[1296px] space-y-6">
        <div className="grid gap-6 lg:grid-cols-[295px_1fr_327px]">
          <div>
            <TBSGLogo
              src={tenantAssets.footerLogo}
              className="h-[62px] w-[205px]"
            />
            <p className="mt-3 text-justify text-[#6b7280] text-sm leading-5">
              The representative organization for businesses operating in
              manufacturing, trade, and services within the Northwest of Ho Chi
              Minh City. We aim to serve as a trusted bridge between
              enterprises, government authorities, and relevant organizations.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {footerColumns.map(([title, ...links]) => (
              <div key={title} className="space-y-4 lg:pt-10">
                <h3 className="font-semibold text-[#030712] text-sm">
                  {title}
                </h3>
                <ul className="space-y-3 text-[#6b7280] text-sm">
                  {links.map((link) => (
                    <li key={link}>{link}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#dcfce7] px-3 py-1.5 text-[#166534] text-[10px]">
              <CheckCircle2 className="size-4 fill-[#16a34a] text-white" />
              Digital Trade & Investment Infrastructure
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xs">Powered by</span>
              <span className="font-bold text-2xl text-[#111827]">
                arobid<span className="text-[#ed6203]">.com</span>
              </span>
            </div>
            <p className="text-[#6b7280] text-xs leading-4">
              Providing cutting-edge investment management technology for modern
              government hubs.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-4">
            <span className="font-semibold">Follow us</span>
            {["f", "Zalo", "▶", "in"].map((item) => (
              <span
                key={item}
                className="grid size-8 place-items-center rounded-full bg-[#1877f2] font-semibold text-white text-xs"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold">Certificated by</span>
            <span className="font-bold text-[#ef4444]">ĐÃ ĐĂNG KÝ</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-semibold">Payment</span>
            <span className="font-bold text-[#ef4444] text-xl">VNPAY</span>
          </div>
        </div>
        <div className="border-t pt-4 text-center text-[#6b7280] text-xs leading-4">
          <p>B2B Marketplace | TradeXpo | Goods for Good | AroUni</p>
          <p className="mt-1">
            Policies and rules: Policy | Legal notice | Terms & conditions |
            Categories Sitemap
          </p>
          <p className="mt-1">
            © 2026 • Arobid Technology Joint Stock Company - Certificate number:
            0318608079 - Address: 2nd floor, 799 Nguyen Van Linh, Tan My Ward,
            Ho Chi Minh City, Vietnam - Email: support@arobid.com
          </p>
        </div>
      </div>
    </footer>
  )
}
