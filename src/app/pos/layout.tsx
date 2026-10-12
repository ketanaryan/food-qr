import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bliss POS | Billing Terminal",
  description: "Hotel White Bliss - Cashier POS & Billing Terminal",
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
  return <>{children}</>;
}
