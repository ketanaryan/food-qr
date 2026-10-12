import type { Metadata } from "next"
import { Geist, Geist_Mono, Playfair_Display } from "next/font/google"
import "./globals.css"
import NavBar from "@/components/common/NavBar"
import { Toaster } from "react-hot-toast"
import PwaInstallPrompt from "@/components/common/PwaInstallPrompt"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  metadataBase: new URL('https://food-qr-gilt.vercel.app'),
  title: "Hotel White Bliss | Luxury Fine Dining & Restaurant",
  description: "Experience luxury fine dining and authentic delicacies at Hotel White Bliss, Pathardi Phata, Nashik. Scan QR, order food, and make table reservations.",
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'White Bliss',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    title: "Hotel White Bliss | Luxury Fine Dining & Restaurant",
    description: "Experience authentic culinary excellence at Hotel White Bliss, Nashik.",
    images: [
      {
        url: "/hotel-white-bliss.jpg",
        width: 1200,
        height: 630,
        alt: "Hotel White Bliss",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#09090b" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable} font-sans antialiased flex flex-col`}
        suppressHydrationWarning
      >
        <main className="flex-1">
          {children}
        </main>
        <PwaInstallPrompt />
        <Toaster />
      </body>
    </html>
  )
}
