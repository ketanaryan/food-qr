import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marquis POS",
  description: "Hotel Marquis - Cashier POS & Billing Terminal",
  manifest: "/manifest-pos.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Marquis POS",
  },
  icons: {
    icon: "/icons/icon-pos-192.png",
    apple: "/icons/apple-touch-icon-pos.png",
  },
};

export default function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <head>
        <title>Marquis POS</title>
        <meta name="apple-mobile-web-app-title" content="Marquis POS" />
        <meta name="application-name" content="Marquis POS" />
        <link rel="manifest" href="/manifest-pos.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-pos.png" />
      </head>
      {children}
    </>
  );
}
