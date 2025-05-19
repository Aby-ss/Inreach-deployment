"use client"

import Image from "next/image";
import Link from "next/link";
import { useState } from 'react';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>
      
      <div className="absolute w-[95vw] h-[85vh] bg-cover bg-center bg-no-repeat rounded-2xl z-0 left-1/2 transform -translate-x-1/2 mb-[-50px]"
        style={{ backgroundImage: "url('/background.png')" }}
      />

      {/* 🔵 Sticky Full-Width Navbar */}
      <nav className="bg-[#2B2D42] text-white py-4 px-6 sticky top-5 z-50 shadow-md rounded-full mx-4">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          
          {/* 🔹 Logo */}
          <div className="flex items-center">
            <img src="logo.png" alt="Logo" className="h-10 w-auto" />
          </div>

          {/* 🔹 Center Nav Links (Desktop) */}
          <div className="hidden sm:flex text-xl gap-8 items-center text-base font-medium">
            <Link href="#home" className="gabarito-medium tracking-[-0.020em]">Home</Link>
            <Link href="#pricing" className="gabarito-medium tracking-[-0.020em]">Pricing</Link>
            <Link href="#features" className="gabarito-medium tracking-[-0.020em]">Features</Link>
            <Link href="#blogs" className="gabarito-medium tracking-[-0.020em]">Blog</Link>
            <Link href="#about" className="gabarito-medium tracking-[-0.020em]">About Us</Link>
          </div>

          {/* 🔹 Buttons (Desktop) */}
          <div className="hidden sm:flex gap-4 items-center">
            <button className="text-base text-white hover:underline">Login</button>
            <button className="bg-[#686AF1] text-white px-6 py-2 rounded-full text-base">
              Get Started
            </button>
          </div>

          {/* 🔹 Hamburger Icon (Mobile) */}
          <div className="block sm:hidden">
            <button onClick={() => setSidebarOpen(true)}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      <div className={`fixed top-0 left-0 h-full w-full bg-white shadow-lg z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
        
        {/* 🧭 Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <span className="text-2xl font-bold text-[#2B2D42]">Menu</span>
          <button onClick={() => setSidebarOpen(false)}>
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-6 p-6 text-[#2B2D42] font-medium">
          <Link href="#features" onClick={() => setSidebarOpen(false)}>Features</Link>
          <Link href="#pricing" onClick={() => setSidebarOpen(false)}>Pricing</Link>
          <Link href="#faq" onClick={() => setSidebarOpen(false)}>FAQ</Link>
          <Link href="#contact" onClick={() => setSidebarOpen(false)}>Contact</Link>
          <button className="text-left">Login</button>
          <button className="bg-[#686AF1] text-white px-6 py-2 rounded-full w-max">Get Started</button>
        </div>
      </div>

      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        {/* Landing Page Section */}
        <section className="relative flex justify-center w-full mt-30">
          <div
            className="flex flex-col items-center gap-4 mt-10 max-w-4xl w-full px-4 z-10 text-black text-center"
            id="hero-content"
          >
            <div className="border-3 border-[#686AF1] tracking-tight rounded-full px-5 py-2 text-[#686AF1] text-md gabarito-medium bg-white bg-opacity-90">
              Cold Outreach 4.0
            </div>

            <h1 className="gabarito-semibold tracking-tighter text-4xl sm:text-5xl md:text-6xl">
              Get More Clients By Scaling Your Cold Email Outreach
            </h1>

            <h2 className="gabarito-medium tracking-tight text-lg sm:text-xl max-w-[700px]">
              Automate your outreach with tailored AI-generated pitches and effortless sending—turn contacts into clients without wasting hours on manual work
            </h2>

            <div className="flex flex-wrap justify-center gap-4 mt-4">
              <Link href="/Inreachapp">
                <button className="bg-[#686AF1] text-white px-6 py-2 rounded-full text-lg gabarito-semibold shadow-lg">
                  Get Started
                </button>
              </Link>
              <button className="bg-white text-[#686AF1] px-6 py-2 rounded-full text-lg gabarito-semibold border-3 border-[#686AF1]">
                Learn More
              </button>
            </div>
          </div>
        </section>

        
      </main>

    </>
  );
}
