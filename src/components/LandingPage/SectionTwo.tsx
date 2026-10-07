"use client"

import React, { useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"
import FeatureCard from "./FeatureCard"
import { MenuFeatures } from "@/types/MenuFeatures"
import { BarChart3, Bot, Check, CreditCard, LayoutDashboard, QrCode, ShieldCheck, Sparkles } from "lucide-react"

export const cards: MenuFeatures[] = [
  {
    title: ["Dynamic Menus for", "Modern", "Restaurants"],
    description:
      "Create, update, and publish menus in real-time. Change prices, add dishes, or hide items instantly via the admin portal.",
    featureList: [
      "Real-time menu updates",
      "Upload dish photos instantly",
      "No app required for customers"
    ],
    image:
      "https://res.cloudinary.com/dcyn3ewpv/image/upload/v1768656837/original-e8270706177487165a27c6ae895aa842_oxioc5.webp",
    icon: Check,
    iconTitle: "Live Syncing",
    iconSubTitle: "Updated instantly"
  },

  {
    title: ["0% Commission", "Direct UPI", "Payments"],
    description:
      "Bypass payment gateway fees completely. Customers scan your actual UPI QR code or use deep links to pay directly to your bank account.",
    featureList: [
      "Zero transaction fees",
      "Direct bank settlements",
      "Supports GPay, PhonePe, Paytm"
    ],
    image:
      "https://res.cloudinary.com/dcyn3ewpv/image/upload/v1768664077/original-9f056d23aaba6d34bac3b1a2de7e7711_kcxddy.webp",
    icon: CreditCard,
    iconTitle: "UPI Payments",
    iconSubTitle: "Zero Gateway Fees"
  },

  {
    title: ["Live Kitchen &", "Cashier", "Portals"],
    description:
      "Keep your staff in sync. Kitchen gets instant audio alerts for new orders, and Cashiers get notified when tables request the bill or call a waiter.",
    featureList: [
      "Real-time audio alerts",
      "Call Waiter feature",
      "Seamless staff sync"
    ],
    image:
      "https://res.cloudinary.com/dcyn3ewpv/image/upload/v1768663740/0fa73dbd-3ac8-4492-b4dd-e1789e304c4f-cover_grmypr.png",
    icon: LayoutDashboard,
    iconTitle: "Staff Portals",
    iconSubTitle: "Live syncing"
  },

  {
    title: ["QR Code", "Table", "Management"],
    description:
      "Assign unique QR codes to each table. Customers scan and order without waiting for a menu card. Perfect for busy cafes and dhabas.",
    featureList: [
      "Table-wise tracking",
      "Printable QR generation",
      "Faster order flow"
    ],
    image:
      "https://res.cloudinary.com/dcyn3ewpv/image/upload/v1768663966/qr-code-interactive-digital-menu_c7vovg.webp",
    icon: QrCode,
    iconTitle: "QR Enabled",
    iconSubTitle: "Table-wise ordering"
  },

  {
    title: ["Premium", "Customer", "Experience"],
    description:
      "Ultra-fast, mobile-first menu experience designed for your guests. Beautiful grid layouts, real-time bill tracking, and intuitive checkout.",
    featureList: [
      "Lightning-fast loading",
      "Mobile-optimized grid",
      "Live order tracking"
    ],
    image:
      "https://res.cloudinary.com/dcyn3ewpv/image/upload/v1768664039/Screenshot_2026-01-17_210340_pjxvcs.png",
    icon: Sparkles,
    iconTitle: "Smooth UX",
    iconSubTitle: "Optimized experience"
  },

  {
    title: ["Live Sales &", "Analytics", "Dashboard"],
    description:
      "Understand your restaurant’s performance with live metrics. Track today's revenue, order volume, and your top-selling dishes instantly.",
    featureList: [
      "Live revenue tracking",
      "Top-selling dish insights",
      "Interactive sales trends"
    ],
    image:
      "https://res.cloudinary.com/dcyn3ewpv/image/upload/v1768664206/1658314-full_qi7d5e.jpg",
    icon: BarChart3,
    iconTitle: "Analytics",
    iconSubTitle: "Insights generated"
  }
];

export default function SectionTwo() {
    const containerRef = useRef<HTMLElement>(null)
    

    const [isMobile, setIsMobile] = React.useState(true);
    
    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile(); // Check immediately on mount
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    })

    const rawX = useTransform(
        scrollYProgress,
        [0, 1],
        [0, -(cards.length - 1) * (typeof window !== "undefined" ? window.innerWidth : 0)]
    )

    const x = useSpring(rawX, {
        stiffness: 70,
        damping: 25,
        mass: 0.9
    })

    if (isMobile) {
        return (
            <section id="feature" className="relative bg-[#F8F5F0] rounded-t-4xl py-12 flex flex-col gap-12 overflow-hidden z-10">
                {cards.map((data, i) => (
                    <div key={i} className="w-full shrink-0">
                        <FeatureCard feature={data} />
                    </div>
                ))}
            </section>
        );
    }
    
    return (
        <section
            id="feature"
            ref={containerRef}
            className="relative h-[300vh] bg-[#F8F5F0] rounded-t-4xl z-10"
        >
            <div className="absolute -z-10 inset-0 lg:bg-transparent lg:bg-gradient-to-r lg:from-black/90 lg:via-black/30 lg:to-transparent pointer-events-none" />
            <div className="sticky top-0 h-screen overflow-hidden flex items-center">
                <motion.ul
                    style={{ x }}
                    className="flex"
                >
                    {cards.map((data, i) => (
                        <motion.li key={i} className="w-screen shrink-0">
                            <FeatureCard feature={data} />
                        </motion.li>
                    ))}
                </motion.ul>
            </div>
        </section>
    )
}
