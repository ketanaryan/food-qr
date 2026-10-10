"use client"

import React from "react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"
import NavBar from "../common/NavBar"
import Footer from "../common/Footer"

export default function RestaurantLanding() {
  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* HERO SECTION */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/hotel-white-bliss.jpg"
            alt="Hotel White Bliss Hero"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 w-full max-w-5xl px-6 md:px-12 flex flex-col items-start mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl lg:text-7xl font-playfair font-medium text-white tracking-wide max-w-3xl leading-tight drop-shadow-lg"
          >
            A TASTE WORTH REVISITING
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-6 text-xl md:text-2xl text-white/90 font-light max-w-2xl drop-shadow-md"
          >
            Globally Inspired Dining In Intimate, Cozy Spaces
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mt-10"
          >
            <a 
              href="#reservation"
              className="inline-block border-2 border-white px-8 py-3 text-white font-medium hover:bg-white hover:text-black transition-colors duration-300 tracking-wide uppercase text-sm"
            >
              Reserve Your Table
            </a>
          </motion.div>
        </div>
      </section>

      {/* GALLERY SECTION */}
      <section className="py-20 md:py-32 px-4 bg-white" id="gallery">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-playfair text-[#1E1B16] uppercase tracking-widest mb-4">
              Our Story Through Plates & Moments
            </h2>
            <p className="text-[#A18D6D] font-script text-2xl md:text-3xl font-playfair italic">
              Hotel White Bliss
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {/* Gallery Images using our local menu images */}
            <div className="relative h-64 md:h-80 overflow-hidden group">
              <Image src="/menu/mutton-biryani.jpg" alt="Gallery 1" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="relative h-64 md:h-80 overflow-hidden group">
              <Image src="/menu/paneer-tikka.jpg" alt="Gallery 2" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="relative h-64 md:h-80 overflow-hidden group">
              <Image src="/menu/dal-makhani.jpg" alt="Gallery 3" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="relative h-64 md:h-80 overflow-hidden group">
              <Image src="/menu/masala-chaas.jpg" alt="Gallery 4" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
            <div className="relative h-64 md:h-80 overflow-hidden group md:col-span-2">
              <Image src="/menu/butter-chicken.jpg" alt="Gallery 5" fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <Link href="/menu" className="inline-block border-2 border-[#1E1B16] text-[#1E1B16] px-8 py-3 font-medium hover:bg-[#1E1B16] hover:text-white transition-colors duration-300 tracking-wide uppercase text-sm">
              Explore Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="py-20 md:py-32 bg-[#F8F5F0]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-playfair text-[#1E1B16] uppercase tracking-widest mb-4">
              Moments Our Guests Love
            </h2>
            <p className="text-[#A18D6D] text-xl md:text-2xl font-playfair italic">
              Experiences Shared By Those Who've Dined With Us.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-10 shadow-sm border border-gray-100 rounded-sm">
              <div className="text-[#A18D6D] flex gap-1 mb-6 text-xl">
                ★★★★★
              </div>
              <p className="text-gray-600 font-light leading-relaxed mb-8 text-lg">
                "Amazing ambience and food is yum... loved everything we ordered. The Butter Chicken was exceptional."
              </p>
              <h4 className="text-[#e28492] font-semibold tracking-wider uppercase text-sm">Priti Patel</h4>
            </div>

            <div className="bg-white p-10 shadow-sm border border-gray-100 rounded-sm">
              <div className="text-[#A18D6D] flex gap-1 mb-6 text-xl">
                ★★★★★
              </div>
              <p className="text-gray-600 font-light leading-relaxed mb-8 text-lg">
                "The ambience was amazing and the staff helped us through every request that we had. Would recommend to anyone and everyone to try this place."
              </p>
              <h4 className="text-[#e28492] font-semibold tracking-wider uppercase text-sm">Harsh</h4>
            </div>
          </div>
        </div>
      </section>

      {/* RESERVATION SECTION */}
      <section id="reservation" className="relative py-24 md:py-40 flex items-center justify-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/menu/garlic-naan.jpg"
            alt="Reservation Background"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/60" />
        </div>

        <div className="relative z-10 w-full max-w-lg bg-[#F8F5F0] p-10 md:p-14 shadow-2xl mx-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-playfair text-[#1E1B16] uppercase tracking-widest mb-4">
              Make A Reservation
            </h2>
            <p className="text-gray-600 text-sm font-light leading-relaxed">
              We're excited to have you with us! Reserve your table and get ready to enjoy delicious food, warm hospitality, and a cozy dining experience.
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <input type="text" placeholder="Full Name" className="w-full bg-transparent border-b border-gray-300 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#A18D6D]" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <input type="tel" placeholder="Phone" className="w-full bg-transparent border-b border-gray-300 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#A18D6D]" />
              <input type="email" placeholder="Email" className="w-full bg-transparent border-b border-gray-300 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#A18D6D]" />
            </div>
            <div>
              <input type="number" placeholder="Number of Person" min="1" className="w-full bg-transparent border-b border-gray-300 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#A18D6D]" />
            </div>
            <div>
              <input type="datetime-local" className="w-full bg-transparent border-b border-gray-300 py-2 text-gray-400 focus:outline-none focus:border-[#A18D6D]" />
            </div>
            <button className="w-full md:w-auto border border-[#1E1B16] text-[#1E1B16] px-8 py-3 mt-4 text-sm tracking-widest uppercase hover:bg-[#1E1B16] hover:text-white transition-colors">
              Book A Table
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  )
}
