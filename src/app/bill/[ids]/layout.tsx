import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "🧾 Official Dining Bill | Hotel Marquis",
  description: "View and download your official dining receipt and itemized tax invoice from Hotel Marquis, Nashik. Thank you for dining with us!",
  openGraph: {
    title: "🧾 Official Dining Bill | Hotel Marquis",
    description: "Verified digital dining receipt & invoice. View items, taxes, and download official PDF.",
    images: [
      {
        url: "/hotel-white-bliss.jpg",
        width: 1200,
        height: 630,
        alt: "Hotel Marquis Bill",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "🧾 Official Dining Bill | Hotel Marquis",
    description: "Verified dining receipt & invoice from Hotel Marquis, Nashik.",
    images: ["/hotel-white-bliss.jpg"],
  },
};

export default function BillLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
