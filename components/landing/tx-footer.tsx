import Image from "next/image"

const footerColumns = [
  ["Get to know us", "About Arobid", "Newsroom", "Careers"],
  ["Business Services", "SmartCapital"],
  ["Source from Arobid", "Request for Quote", "Sourcing Knowledge Center"],
  [
    "Sell on Arobid.com",
    "Start Selling on Arobid",
    "Seller Central Login",
    "Membership Program"
  ],
  ["Get support", "Help Center", "Contact us"]
]

export function TxFooter() {
  return (
    <footer className="border-[#f3f4f6] border-t bg-white px-5 py-11 md:px-[72px]">
      <div className="grid gap-8 md:grid-cols-5">
        {footerColumns.map(([title, ...items]) => (
          <div key={title}>
            <h3 className="font-semibold text-sm">{title}</h3>
            <ul className="mt-4 space-y-3 text-[#6b7280] text-sm">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-8 border-[#f3f4f6] border-b pb-6">
        <span className="font-semibold text-sm">Follow us</span>
        <span className="font-bold text-3xl text-[#1877f2]">f</span>
        <span className="font-bold text-[#0068ff] text-xl">Zalo</span>
        <span className="grid h-7 w-9 place-items-center rounded bg-red-600 font-bold text-white text-xs">
          You
        </span>
        <span className="grid size-8 place-items-center rounded bg-[#0a66c2] font-bold text-white">
          in
        </span>
        <span className="ml-4 font-semibold text-sm">Certified</span>
        <Image
          src="/landing/bct-certi.png"
          alt="bct logo"
          width={100}
          height={100}
        />
        <span className="ml-4 font-semibold text-sm">Payment</span>
        <Image
          src="/landing/vnpay.svg"
          alt="VNPAY logo"
          width={40}
          height={40}
        />
      </div>
      <div className="mt-4 space-y-1 text-center text-[#6b7280] text-xs">
        <p>B2B Marketplace | TradeXpo | Goods for Good | AroUni</p>
        <p>
          Policies and rules: Policy | Legal notice | Terms & conditions |
          Categories Sitemap
        </p>
        <p>
          (c) 2026 - Arobid Technology Joint Stock Company - Certificate number:
          0318608079 - Email: support@arobid.com
        </p>
      </div>
    </footer>
  )
}
