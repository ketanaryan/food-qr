"use client"
import Image from "next/image"
import SectionOne from "./SectionOne"
import { ReactLenis } from 'lenis/react';
import SectionTwo from "./SectionTwo";
import NavBar from "../common/NavBar";
import PricingSection from "./PricingSection";
import FaQsection from "./FaQsection";
import Footer from "../common/Footer";

export default function Index() {
    return (
        <ReactLenis root>
            <div className="min-h-screen w-full flex flex-col justify-center">
                <div className="fixed inset-0 -z-10 bg-black">
                    <Image
                        src="/hotel-white-bliss.jpg"
                        alt="Hero background"
                        fill
                        priority
                        className="object-cover object-center opacity-80"
                    />
                </div>

                <SectionOne />
                <SectionTwo />
                <PricingSection />
                <FaQsection />
                <Footer />
            </div>
        </ReactLenis>

    )
}
