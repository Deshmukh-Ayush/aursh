import type { Metadata } from "next"
import { Geist_Mono, Inter, Instrument_Serif } from "next/font/google"
import { SpeedInsights } from '@vercel/speed-insights/next';

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Agentation } from "agentation";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: {
    template: "%s | Scrunity",
    default: "Scrunity — B2B Client Workspace",
  },
  description: "Scrunity is a B2B client workspace for agencies and freelancers to manage projects, contracts, deliverables, and client collaboration in one place.",
}

const inter = Inter({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const fontSerif = Instrument_Serif({
  weight: ["400"],
  subsets: ["latin"],
  variable: "--font-serif",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", inter.variable, fontSerif.variable)}
    >
      <body suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={200}>
            {children}
            <SpeedInsights />
            <Analytics />
            {process.env.NODE_ENV === "development" && <Agentation />}
            <Toaster richColors position="top-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
