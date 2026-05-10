import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Geist_Mono, Google_Sans, Google_Sans_Flex } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
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

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
})

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        googleSans.variable,
        googleSansFlex.variable
      )}
    >
      <body>
        <TooltipProvider>
          <ThemeProvider>
            {children}
            <Toaster />
          </ThemeProvider>
        </TooltipProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
