"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { faqs } from "./data";

type FaqsProps = {
  defaultOpenFaq?: number;
};

export function Faqs({ defaultOpenFaq = 1 }: FaqsProps) {
  const [openFaq, setOpenFaq] = useState(defaultOpenFaq);

  return (
    <section className="bg-[#f9fafb] px-5 py-16">
      <h2 className="text-center font-bold text-3xl leading-10">
        Frequently asked questions
      </h2>
      <div className="mx-auto mt-10 max-w-5xl">
        <div className="grid border-[#e5e7eb] border-b text-center md:grid-cols-3">
          {["For Sellers", "For Buyers", "For Partners"].map((tab, index) => (
            <button
              type="button"
              key={tab}
              className={cn(
                "h-12 text-sm",
                index === 0 && "border-[#ed6203] border-b-2 text-[#ed6203]",
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-5">
          {faqs.map((faq, index) => {
            const open = openFaq === index;
            return (
              <button
                key={faq.question}
                type="button"
                onClick={() => setOpenFaq(open ? -1 : index)}
                className={cn(
                  "w-full rounded-lg px-6 py-5 text-left text-sm",
                  open
                    ? "bg-white shadow-[0_0_24px_rgba(0,0,0,0.08)]"
                    : "bg-[#f9fafb]",
                )}
              >
                <span className="flex items-center justify-between gap-4 font-medium">
                  {faq.question}
                  {open ? (
                    <Minus className="size-5 text-[#6b7280]" />
                  ) : (
                    <Plus className="size-5 text-[#6b7280]" />
                  )}
                </span>
                {open && (
                  <span className="mt-3 block text-foreground leading-5">
                    {faq.answer}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
