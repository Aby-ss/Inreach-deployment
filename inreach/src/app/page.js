"use client"

import Image from "next/image";
import Link from "next/link";
import { useState } from 'react';

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <>

      <nav className="bg-[#2B2D42] text-white py-3 px-6 sticky top-5 z-50 shadow-md rounded-full mx-6">
        <div className="max-w-[1440px] mx-auto flex justify-between items-center">
          
          {/* 🔹 Logo */}
          <div className="flex items-center">
            <img src="logo.png" alt="Logo" className="h-7 w-auto" />
          </div>

          <div className="hidden sm:flex text-xl gap-8 items-center text-base font-medium">
            <Link href="#home" className="gabarito-medium tracking-[-0.020em]">Home</Link>
            <Link href="#pricing" className="gabarito-medium tracking-[-0.020em]">Pricing</Link>
            <Link href="#features" className="gabarito-medium tracking-[-0.020em]">Features</Link>
            <Link href="#blogs" className="gabarito-medium tracking-[-0.020em]">Blog</Link>
            <Link href="#about" className="gabarito-medium tracking-[-0.020em]">About Us</Link>
          </div>

          {/* 🔹 Buttons (Desktop) */}
          <div className="hidden sm:flex gap-7 items-center">
            <button className="bg-[#686AF1] text-white px-6 py-3 rounded-full gabarito-semibold tracking-tight">
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

          <div className="absolute left-10 top-30 z-0 w-32 sm:w-40 md:w-52 lg:w-84">
            <img src="LeftWidgets.png" className="w-full h-auto" />
          </div>

          <div className="absolute right-20 top-50 z-0 w-24 sm:w-36 md:w-48 lg:w-70">
            <img src="RightWidgets.png" className="w-full h-auto" />
          </div>

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

        {/* Features Section */}
        <section className="relative flex justify-center w-full mt-30">
          <div
            className="flex flex-col items-center gap-4 mt-10 max-w-4xl w-full px-4 z-10 text-black text-center"
            id="hero-content"
          >
            {/* Features Section */}
          <h1 className="gabarito-semibold tracking-tighter w-[1000px] text-4xl sm:text-5xl md:text-6xl">
            Smarter Cold Outreach, On <span className="relative inline-block underline-custom">Autopilot</span>
          </h1>

          <h2 className="gabarito-medium tracking-tight mt-2 text-lg sm:text-xl max-w-[780px] leading-6">
            Handle outreach like a team of five—generate custom pitches, upload your contacts, and start sending in minutes. Perfect for solo founders who want results without the overhead
          </h2>

          <div className="flex justify-center w-full py-16">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-110 px-4 w-full max-w-[1800px] mx-auto justify-items-center">
              
              <div className="bg-[#FEFEFE] border border-[#E0E3E2] rounded-xl p-7 pt-16 flex flex-col gap-4 w-full min-w-[420px] shadow-xs">
                <img
                  src="/note.png"
                  alt="AI Assistant"
                  className="w-8 h-8 object-cover"
                />
                <h1 className="text-xl tracking-tight gabarito-medium font-semibold text-left text-black">
                  Personalisation That Persuades
                </h1>
                <p className="text-[15.5px] leading-6 text-left tracking-tight gabarito-medium max-w-[550px]">
                  Craft high-converting pitches with AI that understands your goals and mirrors proven outreach strategies—so every message feels personal, polished, and on point
                </p>
              </div>

              <div className="bg-[#FEFEFE] border border-[#E0E3E2] rounded-xl p-7 pt-16 flex flex-col gap-4 w-full min-w-[420px] shadow-xs">
                <img
                  src="/chip.png"
                  alt="Automation Engine"
                  className="w-8 h-8 object-cover"
                />
                <h1 className="text-xl tracking-tight gabarito-medium font-semibold text-left text-black">
                  Automated Outreach
                </h1>
                <p className="text-[15.5px] leading-6 text-left tracking-tight gabarito-medium max-w-[550px]">
                  Upload a contact list, write a single prompt, and let the system handle the delivery—every email sent, tracked, and optimized with zero manual effort
                </p>
              </div>

              <div className="bg-[#FEFEFE] border border-[#E0E3E2] rounded-xl p-7 pt-16 flex flex-col gap-4 w-full min-w-[420px] shadow-xs">
                <img
                  src="/time.png"
                  alt="Analytics Dashboard"
                  className="w-8 h-8 object-cover"
                />
                <h1 className="text-xl tracking-tight gabarito-medium font-semibold text-left text-black">
                  Save Hours, Scale Faster
                </h1>
                <p className="text-[15.5px] leading-6 text-left tracking-tight gabarito-medium max-w-[550px]">
                  Stop wasting time on repetitive tasks. Launch scalable campaigns in minutes and refocus your energy on building relationships and growing your business
                </p>
              </div>

            </div>
          </div>

          </div>
        </section>

        {/* How it Works Section */}
        <section className="w-full flex justify-center items-center py-20 px-4">
          <div className="max-w-7xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

            <div className="rounded-xl overflow-hidden shadow-lg w-full h-[300px] md:h-[500px]">
              <video
                className="w-full h-full object-cover"
                controls
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
              >
                <source src="/demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>

            <div className="text-left">
              <h1 className="text-3xl md:text-6xl gabarito-semibold tracking-tighter text-[#1A1A1A] mb-4 w-[800px]">
                Turn Words Into <br/>  <span className="bg-[#00D091] px-2 -rotate-1 inline-block"><span className="text-white">Winning Emails</span></span> in Seconds
              </h1>
              <h3 className="text-lg md:text-lg gabarito-medium tracking-tight text-[#555] mt-15">
                <span className="text-black text-xl">1. Drag, Drop & Auto-Detect Contacts</span> <br/> <span className="leading-5">Upload your contact list in seconds — our smart importer instantly detects names, emails, and websites, so you can skip the manual setup and jump straight into outreach</span> <br/> <br/>
                <span className="text-black text-xl">2. Generate AI-Written Pitches That Convert</span> <br/> <span className="leading-5">Craft persuasive, professional-grade email pitches with just a prompt — built on expert-backed strategies and refined for conversion</span> <br/> <br/>
                <span className="text-black text-xl">3. Automate Campaign Launch & Email Tracking</span> <br/> <span className="leading-5">Launch your campaign with one click — emails are sent, tracked, and logged automatically, letting you scale without lifting a finger</span> <br/>
              </h3>
            </div>

          </div>
        </section>

        {/* Footer Section */}
        <footer className="bg-[#f2f2f2] py-12 px-6 w-screen">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-10">
            
            {/* Left Side: Image + Text */}
            <div className="flex flex-col gap-2 max-w-sm">
              <img src="BlackLogo.png" className="w-28 h-auto mb-2" />
              <h3 className="text-lg w-[520px] gabarito-medium text-black tracking-tight leading-6">Inreach is a streamlined outreach tool built for solo founders and small teams—generate professional AI-written email pitches and automate delivery, so you can focus on scaling your business, not writing emails</h3>
              <h2 className="text-2xl tracking-tight w-max gabarito-semibold text-black mt-1">Outreach like a team of ten. Powered by one—You + AI</h2>
              <h2 className="text-md w-max gabarito-semibold tracking-tight text-black mt-3">Hey there 👋 I’m Rao, the maker of Inreach. Feel free to check out my work over on Twitter</h2>
            </div>

            {/* Right Side: Two Columns */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-2xl">
              {/* Column 1 */}
              <div>
                <h1 className="text-lg gabarito-semibold text-black mb-2">Links</h1>
                <ul className="space-y-1">
                  <li><a href="#" className="text-gray-600 gabarito-medium hover:underline">Home</a></li>
                  <li><a href="#" className="text-gray-600 gabarito-medium hover:underline">Features</a></li>
                  <li><a href="#" className="text-gray-600 gabarito-medium hover:underline">How it Works</a></li>
                  <li><a href="#" className="text-gray-600 gabarito-medium hover:underline">Support</a></li>
                </ul>
              </div>

              {/* Column 2 */}
              <div>
                <h1 className="text-lg gabarito-semibold text-black mb-2">More</h1>
                <ul className="space-y-1">
                  <li><a href="#" className="text-gray-600 gabarito-medium hover:underline">Follow on Twitter</a></li>
                  <li><a href="#" className="text-gray-600 gabarito-medium hover:underline">Follow on Instagram</a></li>
                  <li><a href="#" className="text-gray-600 gabarito-medium hover:underline">Creator</a></li>
                </ul>
              </div>
            </div>
          </div>
        </footer>
      </main>

    </>
  );
}
