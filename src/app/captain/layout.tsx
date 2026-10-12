import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bliss Captain | Waiter POS",
  description: "Hotel White Bliss - Waiter & Captain Order Taking App",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Bliss Captain",
  },
  icons: {
    icon: "/icons/icon-captain-192.png",
    apple: "/icons/apple-touch-icon-captain.png",
  },
};

export default function CaptainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
