import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Google_Sans, Google_Sans_Flex } from "next/font/google"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"

const googleSans = Google_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  adjustFontFallback: false
})
const googleSansFlex = Google_Sans_Flex({
  subsets: ["latin"],
  variable: "--font-tight",
  adjustFontFallback: false
})

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "antialiased",
        "font-sans",
        googleSans.variable,
        googleSansFlex.variable
      )}
    >
      <body>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
