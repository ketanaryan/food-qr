import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marquis Captain",
  description: "Hotel Marquis - Waiter & Captain Order Taking App",
  manifest: "/manifest-captain.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Marquis Captain",
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
  return (
    <>
      <head>
        <title>Marquis Captain</title>
        <meta name="apple-mobile-web-app-title" content="Marquis Captain" />
        <meta name="application-name" content="Marquis Captain" />
        <link rel="manifest" href="/manifest-captain.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-captain.png" />
      </head>
      {children}
    </>
  );
}
