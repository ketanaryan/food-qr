import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bliss POS",
  description: "Hotel White Bliss - Cashier POS & Billing Terminal",
  manifest: "/manifest-pos.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bliss POS",
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
        <title>Bliss POS</title>
        <meta name="apple-mobile-web-app-title" content="Bliss POS" />
        <meta name="application-name" content="Bliss POS" />
        <link rel="manifest" href="/manifest-pos.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-pos.png" />
      </head>
      {children}
    </>
  );
}
